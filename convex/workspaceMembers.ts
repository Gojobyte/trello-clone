import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'
import {
  requireWorkspaceAccess,
  requireWorkspaceOwner,
} from './lib_workspace_access'

export const listMembers = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    await requireWorkspaceAccess(ctx, args.workspaceId)
    return await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
  },
})

export const listPendingInvitations = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId)
    const all = await ctx.db
      .query('workspaceInvitations')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    return all.filter((i) => i.status === 'pending')
  },
})

// Invitations en attente pour le user connecté
export const listMyInvitations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    if (!user.email) return []
    const invitations = await ctx.db
      .query('workspaceInvitations')
      .withIndex('by_email', (q) => q.eq('email', user.email as string))
      .collect()
    const pending = invitations.filter((i) => i.status === 'pending')
    const enriched = await Promise.all(
      pending.map(async (inv) => {
        const workspace = await ctx.db.get(inv.workspaceId)
        return {
          ...inv,
          workspaceName: workspace?.name ?? '(supprimé)',
          workspaceColor: workspace?.color,
        }
      }),
    )
    return enriched.filter((i) => i.workspaceName !== '(supprimé)')
  },
})

export const invite = mutation({
  args: { workspaceId: v.id('workspaces'), email: v.string() },
  handler: async (ctx, args) => {
    const { user, workspace } = await requireWorkspaceOwner(
      ctx,
      args.workspaceId,
    )
    const email = args.email.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      throw new Error('Email invalide')
    }
    if (email === user.email?.toLowerCase()) {
      throw new Error('Vous êtes déjà propriétaire de cet espace')
    }
    const existingMembers = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    if (existingMembers.find((m) => m.userEmail.toLowerCase() === email)) {
      throw new Error('Cette personne est déjà membre')
    }
    const existingInv = await ctx.db
      .query('workspaceInvitations')
      .withIndex('by_workspace_and_email', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('email', email),
      )
      .collect()
    if (existingInv.find((i) => i.status === 'pending')) {
      throw new Error('Une invitation est déjà en attente pour cet email')
    }
    await ctx.db.insert('workspaceInvitations', {
      workspaceId: args.workspaceId,
      email,
      invitedById: user._id,
      invitedByName: user.name ?? user.email ?? 'Quelqu\'un',
      status: 'pending',
    })
    return { workspaceName: workspace.name }
  },
})

export const acceptInvitation = mutation({
  args: { invitationId: v.id('workspaceInvitations') },
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
    const existing = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspace_and_user', (q) =>
        q.eq('workspaceId', invitation.workspaceId).eq('userId', user._id),
      )
      .unique()
    if (!existing) {
      await ctx.db.insert('workspaceMembers', {
        workspaceId: invitation.workspaceId,
        userId: user._id,
        userEmail: user.email,
        userName: user.name ?? user.email,
        role: 'member',
      })
    }
    await ctx.db.patch(args.invitationId, { status: 'accepted' })
    return invitation.workspaceId
  },
})

export const declineInvitation = mutation({
  args: { invitationId: v.id('workspaceInvitations') },
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

export const revokeInvitation = mutation({
  args: { invitationId: v.id('workspaceInvitations') },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) throw new Error('Invitation introuvable')
    await requireWorkspaceOwner(ctx, invitation.workspaceId)
    await ctx.db.delete(args.invitationId)
  },
})

export const removeMember = mutation({
  args: { memberId: v.id('workspaceMembers') },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId)
    if (!member) throw new Error('Membre introuvable')
    if (member.role === 'owner') {
      throw new Error('Impossible de retirer le propriétaire')
    }
    await requireWorkspaceOwner(ctx, member.workspaceId)
    await ctx.db.delete(args.memberId)
  },
})

export const leaveWorkspace = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const membership = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspace_and_user', (q) =>
        q.eq('workspaceId', args.workspaceId).eq('userId', user._id),
      )
      .unique()
    if (!membership) throw new Error('Vous n\'êtes pas membre')
    if (membership.role === 'owner') {
      throw new Error(
        'Le propriétaire ne peut pas quitter — supprimez l\'espace à la place',
      )
    }
    await ctx.db.delete(membership._id)
  },
})
