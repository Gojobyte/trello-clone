import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireUser } from './lib_auth'
import { requireBoardAccess, requireBoardOwner } from './lib_board_access'

export const toggleStar = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    const { board } = await requireBoardAccess(ctx, args.boardId)
    await ctx.db.patch(args.boardId, { starred: !board.starred })
  },
})

// Retourne tous les boards visibles par l'utilisateur :
// 1) ceux qu'il possède
// 2) ceux où il est invité directement (boardMembers)
// 3) ceux des workspaces où il est membre (workspaceMembers)
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const seen = new Set<string>()
    const result: Array<unknown> = []

    const owned = await ctx.db
      .query('boards')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .collect()
    for (const b of owned) {
      if (!seen.has(b._id)) {
        seen.add(b._id)
        result.push(b)
      }
    }

    // Boards où le user est membre direct
    const boardMemberships = await ctx.db
      .query('boardMembers')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    for (const m of boardMemberships) {
      if (m.role === 'owner') continue
      if (seen.has(m.boardId)) continue
      const b = await ctx.db.get(m.boardId)
      if (b) {
        seen.add(b._id)
        result.push({ ...b, _isMember: true as const })
      }
    }

    // Boards via workspaces (où user est member)
    const wsMemberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    for (const wm of wsMemberships) {
      if (wm.role === 'owner') continue // déjà couvert par 'owned' workspaces
      const boards = await ctx.db
        .query('boards')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', wm.workspaceId))
        .collect()
      for (const b of boards) {
        if (seen.has(b._id)) continue
        seen.add(b._id)
        result.push({ ...b, _isMember: true as const })
      }
    }

    return result as Array<typeof owned[number]>
  },
})

export const get = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    // Tolère l'absence d'accès (retourne null) pour ne pas crasher la route
    try {
      const { board } = await requireBoardAccess(ctx, args.boardId)
      const lists = await ctx.db
        .query('lists')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()
      const allCards = await ctx.db
        .query('cards')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()
      const cards = allCards.filter((c) => !c.archived)
      return {
        board,
        lists: lists.sort((a, b) => a.position - b.position),
        cards: cards.sort((a, b) => a.position - b.position),
      }
    } catch {
      return null
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    backgroundImage: v.optional(v.string()),
    // Tout board doit appartenir à un workspace (plus de boards orphelins)
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    // Vérifier que l'user a accès au workspace
    const ws = await ctx.db.get(args.workspaceId)
    if (!ws) throw new Error('Workspace not found')
    const isOwner = ws.ownerId === user._id
    if (!isOwner) {
      const membership = await ctx.db
        .query('workspaceMembers')
        .withIndex('by_workspace_and_user', (q) =>
          q.eq('workspaceId', args.workspaceId).eq('userId', user._id),
        )
        .unique()
      if (!membership) throw new Error('Unauthorized workspace')
    }
    const boardId = await ctx.db.insert('boards', {
      name: args.name,
      description: args.description,
      color: args.color,
      backgroundImage: args.backgroundImage,
      ownerId: user._id,
      workspaceId: args.workspaceId,
    })
    await ctx.db.insert('boardMembers', {
      boardId,
      userId: user._id,
      userEmail: user.email ?? '',
      userName: user.name ?? user.email ?? 'Moi',
      role: 'owner',
    })
    return boardId
  },
})

// Déplace un board dans un workspace, ou hors workspace (workspaceId = null)
export const moveToWorkspace = mutation({
  args: {
    boardId: v.id('boards'),
    workspaceId: v.union(v.id('workspaces'), v.null()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireBoardAccess(ctx, args.boardId)
    if (args.workspaceId) {
      const ws = await ctx.db.get(args.workspaceId)
      if (!ws) throw new Error('Workspace not found')
      const isOwner = ws.ownerId === user._id
      if (!isOwner) {
        const membership = await ctx.db
          .query('workspaceMembers')
          .withIndex('by_workspace_and_user', (q) =>
            q.eq('workspaceId', args.workspaceId!).eq('userId', user._id),
          )
          .unique()
        if (!membership) throw new Error('Unauthorized workspace')
      }
    }
    await ctx.db.patch(args.boardId, {
      workspaceId: args.workspaceId ?? undefined,
    })
  },
})

export const updateBackground = mutation({
  args: {
    boardId: v.id('boards'),
    color: v.optional(v.string()),
    backgroundImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    await ctx.db.patch(args.boardId, {
      color: args.color,
      backgroundImage: args.backgroundImage,
    })
  },
})

export const rename = mutation({
  args: { boardId: v.id('boards'), name: v.string() },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    await ctx.db.patch(args.boardId, { name: args.name })
  },
})

export const updateDescription = mutation({
  args: { boardId: v.id('boards'), description: v.string() },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    await ctx.db.patch(args.boardId, { description: args.description })
  },
})

// Clone un tableau complet (listes + cartes non archivées + étiquettes)
export const duplicate = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    const { user, board: original } = await requireBoardAccess(
      ctx,
      args.boardId,
    )
    const newBoardId = await ctx.db.insert('boards', {
      name: `${original.name} (copie)`,
      description: original.description,
      color: original.color,
      backgroundImage: original.backgroundImage,
      ownerId: user._id,
    })
    await ctx.db.insert('boardMembers', {
      boardId: newBoardId,
      userId: user._id,
      userEmail: user.email ?? '',
      userName: user.name ?? user.email ?? 'Moi',
      role: 'owner',
    })
    const labels = await ctx.db
      .query('labels')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    const labelMap = new Map<Id<'labels'>, Id<'labels'>>()
    for (const label of labels) {
      const newId = await ctx.db.insert('labels', {
        boardId: newBoardId,
        color: label.color,
        text: label.text,
      })
      labelMap.set(label._id, newId)
    }
    const lists = await ctx.db
      .query('lists')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const list of lists.filter((l) => !l.archived)) {
      const newListId = await ctx.db.insert('lists', {
        boardId: newBoardId,
        name: list.name,
        position: list.position,
      })
      const cards = await ctx.db
        .query('cards')
        .withIndex('by_list', (q) => q.eq('listId', list._id))
        .collect()
      for (const card of cards.filter((c) => !c.archived)) {
        await ctx.db.insert('cards', {
          listId: newListId,
          boardId: newBoardId,
          title: card.title,
          description: card.description,
          position: card.position,
          coverColor: card.coverColor,
          coverImage: card.coverImage,
          labelIds: (card.labelIds ?? [])
            .map((id) => labelMap.get(id))
            .filter((id): id is Id<'labels'> => Boolean(id)),
        })
      }
    }
    return newBoardId
  },
})

export const remove = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    await requireBoardOwner(ctx, args.boardId)
    const cards = await ctx.db
      .query('cards')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const card of cards) {
      await ctx.db.delete(card._id)
    }
    const lists = await ctx.db
      .query('lists')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const list of lists) {
      await ctx.db.delete(list._id)
    }
    const members = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const m of members) {
      await ctx.db.delete(m._id)
    }
    const invitations = await ctx.db
      .query('boardInvitations')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    for (const i of invitations) {
      await ctx.db.delete(i._id)
    }
    await ctx.db.delete(args.boardId)
  },
})
