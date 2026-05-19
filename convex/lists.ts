import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireBoardAccess } from './lib_board_access'

async function requireListAccess(
  ctx: Parameters<typeof requireBoardAccess>[0],
  listId: import('./_generated/dataModel').Id<'lists'>,
) {
  const list = await ctx.db.get(listId)
  if (!list) throw new Error('List not found')
  const access = await requireBoardAccess(ctx, list.boardId)
  return { ...access, list }
}

export const create = mutation({
  args: { boardId: v.id('boards'), name: v.string() },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    const existing = await ctx.db
      .query('lists')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    const position =
      existing.length === 0
        ? 1000
        : Math.max(...existing.map((l) => l.position)) + 1000
    return await ctx.db.insert('lists', {
      boardId: args.boardId,
      name: args.name,
      position,
    })
  },
})

export const rename = mutation({
  args: { listId: v.id('lists'), name: v.string() },
  handler: async (ctx, args) => {
    await requireListAccess(ctx, args.listId)
    await ctx.db.patch(args.listId, { name: args.name })
  },
})

export const reorder = mutation({
  args: { listId: v.id('lists'), position: v.number() },
  handler: async (ctx, args) => {
    await requireListAccess(ctx, args.listId)
    await ctx.db.patch(args.listId, { position: args.position })
  },
})

export const archive = mutation({
  args: { listId: v.id('lists'), archived: v.boolean() },
  handler: async (ctx, args) => {
    await requireListAccess(ctx, args.listId)
    await ctx.db.patch(args.listId, { archived: args.archived })
  },
})

// Duplique une liste + toutes ses cartes (non archivées)
export const duplicate = mutation({
  args: { listId: v.id('lists') },
  handler: async (ctx, args) => {
    const { list } = await requireListAccess(ctx, args.listId)
    const allLists = await ctx.db
      .query('lists')
      .withIndex('by_board', (q) => q.eq('boardId', list.boardId))
      .collect()
    const next = allLists
      .filter((l) => l.position > list.position)
      .sort((a, b) => a.position - b.position)[0]
    const newPos = next
      ? (list.position + next.position) / 2
      : list.position + 1000

    const newListId = await ctx.db.insert('lists', {
      boardId: list.boardId,
      name: `${list.name} (copie)`,
      position: newPos,
    })

    const cards = await ctx.db
      .query('cards')
      .withIndex('by_list', (q) => q.eq('listId', list._id))
      .collect()
    for (const card of cards.filter((c) => !c.archived)) {
      await ctx.db.insert('cards', {
        listId: newListId,
        boardId: card.boardId,
        title: card.title,
        description: card.description,
        position: card.position,
        labelIds: card.labelIds,
        coverColor: card.coverColor,
        coverImage: card.coverImage,
      })
    }
    return newListId
  },
})

export const remove = mutation({
  args: { listId: v.id('lists') },
  handler: async (ctx, args) => {
    await requireListAccess(ctx, args.listId)
    const cards = await ctx.db
      .query('cards')
      .withIndex('by_list', (q) => q.eq('listId', args.listId))
      .collect()
    for (const card of cards) {
      await ctx.db.delete(card._id)
    }
    await ctx.db.delete(args.listId)
  },
})
