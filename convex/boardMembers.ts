import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'
import { requireBoardAccess, requireBoardOwner } from './lib_board_access'
import { recordActivity } from './lib_activity'

// Liste tous les membres d'un board (owner inclus)
export const listMembers = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    return await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
  },
})

// Liste les invitations en attente pour un board (visible par l'owner)
export const listPendingInvitations = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    await requireBoardOwner(ctx, args.boardId)
    const all = await ctx.db
      .query('boardInvitations')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    return all.filter((i) => i.status === 'pending')
  },
})

// Liste les invitations en attente pour le user connecté (par email)
export const listMyInvitations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    if (!user.email) return []
    const invitations = await ctx.db
      .query('boardInvitations')
      .withIndex('by_email', (q) => q.eq('email', user.email as string))
      .collect()
    const pending = invitations.filter((i) => i.status === 'pending')
    // Enrichir avec le nom du board
    const enriched = await Promise.all(
      pending.map(async (inv) => {
        const board = await ctx.db.get(inv.boardId)
        return {
          ...inv,
          boardName: board?.name ?? '(supprimé)',
          boardColor: board?.color,
          boardBackgroundImage: board?.backgroundImage,
        }
      }),
    )
    return enriched.filter((i) => i.boardName !== '(supprimé)')
  },
})

// Invite quelqu'un par email. Si le user existe déjà → ajouter direct comme membre.
// Sinon → créer une invitation pending.
export const invite = mutation({
  args: { boardId: v.id('boards'), email: v.string() },
  handler: async (ctx, args) => {
    const { user, board } = await requireBoardOwner(ctx, args.boardId)
    const email = args.email.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      throw new Error('Email invalide')
    }
    if (email === user.email?.toLowerCase()) {
      throw new Error('Vous êtes déjà propriétaire de ce tableau')
    }
    // Vérifier qu'il n'est pas déjà membre
    const existingMembers = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    const alreadyMember = existingMembers.find(
      (m) => m.userEmail.toLowerCase() === email,
    )
    if (alreadyMember) {
      throw new Error('Cette personne est déjà membre')
    }
    // Vérifier qu'il n'y a pas déjà une invitation pending
    const existingInv = await ctx.db
      .query('boardInvitations')
      .withIndex('by_board_and_email', (q) =>
        q.eq('boardId', args.boardId).eq('email', email),
      )
      .collect()
    const pending = existingInv.find((i) => i.status === 'pending')
    if (pending) {
      throw new Error('Une invitation est déjà en attente pour cet email')
    }
    // Créer l'invitation
    await ctx.db.insert('boardInvitations', {
      boardId: args.boardId,
      email,
      invitedById: user._id,
      invitedByName: user.name ?? user.email ?? 'Quelqu\'un',
      status: 'pending',
    })
    await recordActivity(ctx, {
      boardId: args.boardId,
      action: 'member.invite',
      details: email,
    })
    return { boardName: board.name }
  },
})

// Le user connecté accepte une invitation : on l'ajoute aux boardMembers
// et on marque l'invitation comme acceptée.
export const acceptInvitation = mutation({
  args: { invitationId: v.id('boardInvitations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) throw new Error('Invitation introuvable')
    if (invitation.status !== 'pending') {
      throw new Error('Invitation déjà traitée')
    }
    if (
      !user.email ||
      user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      throw new Error('Cette invitation ne vous est pas destinée')
    }
    // Sécurité : vérifier que le user n'est pas déjà membre
    const existing = await ctx.db
      .query('boardMembers')
      .withIndex('by_board_and_user', (q) =>
        q.eq('boardId', invitation.boardId).eq('userId', user._id),
      )
      .unique()
    if (!existing) {
      await ctx.db.insert('boardMembers', {
        boardId: invitation.boardId,
        userId: user._id,
        userEmail: user.email,
        userName: user.name ?? user.email,
        role: 'member',
      })
    }
    await ctx.db.patch(args.invitationId, { status: 'accepted' })
    await recordActivity(ctx, {
      boardId: invitation.boardId,
      action: 'member.join',
      details: user.name ?? user.email,
    })
    return invitation.boardId
  },
})

// Le user connecté décline une invitation
export const declineInvitation = mutation({
  args: { invitationId: v.id('boardInvitations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) throw new Error('Invitation introuvable')
    if (
      !user.email ||
      user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      throw new Error('Cette invitation ne vous est pas destinée')
    }
    await ctx.db.patch(args.invitationId, { status: 'declined' })
  },
})

// L'owner révoque une invitation pending
export const revokeInvitation = mutation({
  args: { invitationId: v.id('boardInvitations') },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) throw new Error('Invitation introuvable')
    await requireBoardOwner(ctx, invitation.boardId)
    await ctx.db.delete(args.invitationId)
  },
})

// L'owner retire un membre du board
export const removeMember = mutation({
  args: { memberId: v.id('boardMembers') },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId)
    if (!member) throw new Error('Membre introuvable')
    if (member.role === 'owner') {
      throw new Error('Impossible de retirer le propriétaire')
    }
    await requireBoardOwner(ctx, member.boardId)
    await ctx.db.delete(args.memberId)
    // Retirer le membre des cartes auxquelles il était assigné (memberIds)
    const cards = await ctx.db
      .query('cards')
      .withIndex('by_board', (q) => q.eq('boardId', member.boardId))
      .collect()
    for (const card of cards) {
      if (card.memberIds?.includes(member.userId)) {
        await ctx.db.patch(card._id, {
          memberIds: card.memberIds.filter((id) => id !== member.userId),
        })
      }
    }
    await recordActivity(ctx, {
      boardId: member.boardId,
      action: 'member.remove',
      details: member.userName,
    })
  },
})

// Le user quitte un board où il est membre (pas owner)
export const leaveBoard = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const membership = await ctx.db
      .query('boardMembers')
      .withIndex('by_board_and_user', (q) =>
        q.eq('boardId', args.boardId).eq('userId', user._id),
      )
      .unique()
    if (!membership) throw new Error('Vous n\'êtes pas membre de ce tableau')
    if (membership.role === 'owner') {
      throw new Error(
        'Le propriétaire ne peut pas quitter — supprimez le tableau à la place',
      )
    }
    await ctx.db.delete(membership._id)
    await recordActivity(ctx, {
      boardId: args.boardId,
      action: 'member.leave',
      details: membership.userName,
    })
  },
})
