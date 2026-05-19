import { mutation } from './_generated/server'
import { authComponent } from './auth'

// Migration ponctuelle : crée une row 'owner' dans boardMembers pour
// chaque board existant qui n'en a pas, en récupérant le vrai nom/email
// depuis Better-Auth.
//
// Usage CLI : npx convex run migrations:backfillBoardOwners
export const backfillBoardOwners = mutation({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query('boards').collect()
    let created = 0
    let updated = 0
    let skipped = 0
    for (const board of boards) {
      const existing = await ctx.db
        .query('boardMembers')
        .withIndex('by_board_and_user', (q) =>
          q.eq('boardId', board._id).eq('userId', board.ownerId),
        )
        .unique()

      // Récupère les infos du user depuis Better-Auth
      const authUser = await authComponent.getAnyUserById(ctx, board.ownerId)
      const userName =
        (authUser as { name?: string } | null)?.name ??
        (authUser as { email?: string } | null)?.email ??
        'Propriétaire'
      const userEmail =
        (authUser as { email?: string } | null)?.email ?? ''

      if (existing) {
        // Si la row existe mais sans email (placeholder migration), enrichit-la
        if (!existing.userEmail && userEmail) {
          await ctx.db.patch(existing._id, { userName, userEmail })
          updated++
        } else {
          skipped++
        }
        continue
      }
      await ctx.db.insert('boardMembers', {
        boardId: board._id,
        userId: board.ownerId,
        userEmail,
        userName,
        role: 'owner',
      })
      created++
    }
    return { created, updated, skipped, total: boards.length }
  },
})

// Suppression admin d'un board par ID (à utiliser seulement via CLI)
// Cascade : listes, cartes, checklistItems, comments, attachments, activity, boardMembers
// Usage : npx convex run migrations:adminDeleteBoard '{"boardId":"j572..."}'
import { v } from 'convex/values'
export const adminDeleteBoard = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId)
    if (!board) return { deleted: false, reason: 'not found' }

    // Récupérer toutes les cartes du board pour cascade
    const cards = await ctx.db
      .query('cards')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const card of cards) {
      // Checklist items
      const items = await ctx.db
        .query('checklistItems')
        .withIndex('by_card', (q) => q.eq('cardId', card._id))
        .collect()
      for (const item of items) await ctx.db.delete(item._id)
      // Comments
      const comments = await ctx.db
        .query('comments')
        .withIndex('by_card', (q) => q.eq('cardId', card._id))
        .collect()
      for (const c of comments) await ctx.db.delete(c._id)
      // Attachments + storage
      const attachments = await ctx.db
        .query('attachments')
        .withIndex('by_card', (q) => q.eq('cardId', card._id))
        .collect()
      for (const a of attachments) {
        await ctx.storage.delete(a.storageId)
        await ctx.db.delete(a._id)
      }
      await ctx.db.delete(card._id)
    }
    // Listes
    const lists = await ctx.db
      .query('lists')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const list of lists) await ctx.db.delete(list._id)
    // Labels
    const labels = await ctx.db
      .query('labels')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const l of labels) await ctx.db.delete(l._id)
    // boardMembers
    const members = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const m of members) await ctx.db.delete(m._id)
    // Invitations
    const invitations = await ctx.db
      .query('boardInvitations')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const i of invitations) await ctx.db.delete(i._id)
    // Activity
    const activity = await ctx.db
      .query('activity')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const a of activity) await ctx.db.delete(a._id)
    // Le board
    await ctx.db.delete(args.boardId)
    return { deleted: true, name: board.name }
  },
})

// Migration ponctuelle : pour chaque user qui n'a pas de workspace,
// en créer un "Mon espace personnel" et y rattacher tous ses boards orphelins
// (workspaceId === undefined).
//
// Usage CLI : npx convex run migrations:attachOrphanBoards
export const attachOrphanBoards = mutation({
  args: {},
  handler: async (ctx) => {
    const orphanBoards = await ctx.db.query('boards').collect()
    const orphans = orphanBoards.filter((b) => !b.workspaceId)
    // Grouper les boards orphelins par owner
    const byOwner = new Map<string, typeof orphans>()
    for (const board of orphans) {
      const list = byOwner.get(board.ownerId) ?? []
      list.push(board)
      byOwner.set(board.ownerId, list)
    }

    let workspacesCreated = 0
    let boardsAttached = 0

    for (const [ownerId, ownerBoards] of byOwner) {
      // Trouver ou créer le workspace personnel
      const existingPersonal = await ctx.db
        .query('workspaces')
        .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
        .collect()
      let workspaceId = existingPersonal[0]?._id
      if (!workspaceId) {
        const authUser = await authComponent.getAnyUserById(ctx, ownerId)
        const userName =
          (authUser as { name?: string } | null)?.name ??
          (authUser as { email?: string } | null)?.email ??
          'Moi'
        const userEmail =
          (authUser as { email?: string } | null)?.email ?? ''
        workspaceId = await ctx.db.insert('workspaces', {
          name: 'Mon espace personnel',
          description: 'Workspace par défaut',
          color: 'emerald',
          ownerId,
        })
        await ctx.db.insert('workspaceMembers', {
          workspaceId,
          userId: ownerId,
          userEmail,
          userName,
          role: 'owner',
        })
        workspacesCreated++
      }
      // Rattacher les boards orphelins
      for (const board of ownerBoards) {
        await ctx.db.patch(board._id, { workspaceId })
        boardsAttached++
      }
    }
    return { workspacesCreated, boardsAttached, totalOrphans: orphans.length }
  },
})

