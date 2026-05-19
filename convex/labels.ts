import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireBoardAccess } from './lib_board_access'

export const listForBoard = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    return await ctx.db
      .query('labels')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
  },
})

export const create = mutation({
  args: {
    boardId: v.id('boards'),
    color: v.string(),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    return await ctx.db.insert('labels', {
      boardId: args.boardId,
      color: args.color,
      text: args.text,
    })
  },
})

export const update = mutation({
  args: {
    labelId: v.id('labels'),
    color: v.optional(v.string()),
    text: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const label = await ctx.db.get(args.labelId)
    if (!label) throw new Error('Label not found')
    await requireBoardAccess(ctx, label.boardId)
    const patch: Record<string, unknown> = {}
    if (args.color !== undefined) patch.color = args.color
    if (args.text !== undefined) patch.text = args.text
    await ctx.db.patch(args.labelId, patch)
  },
})

export const remove = mutation({
  args: { labelId: v.id('labels') },
  handler: async (ctx, args) => {
    const label = await ctx.db.get(args.labelId)
    if (!label) throw new Error('Label not found')
    await requireBoardAccess(ctx, label.boardId)
    const cards = await ctx.db
      .query('cards')
      .withIndex('by_board', (q) => q.eq('boardId', label.boardId))
      .collect()
    for (const card of cards) {
      if (card.labelIds?.includes(args.labelId)) {
        await ctx.db.patch(card._id, {
          labelIds: card.labelIds.filter((id) => id !== args.labelId),
        })
      }
    }
    await ctx.db.delete(args.labelId)
  },
})

export const attach = mutation({
  args: {
    cardId: v.id('cards'),
    labelId: v.id('labels'),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    const label = await ctx.db.get(args.labelId)
    if (!label || label.boardId !== card.boardId) {
      throw new Error('Label does not belong to this board')
    }
    const current = card.labelIds ?? []
    if (current.includes(args.labelId)) return
    await ctx.db.patch(args.cardId, { labelIds: [...current, args.labelId] })
  },
})

export const detach = mutation({
  args: {
    cardId: v.id('cards'),
    labelId: v.id('labels'),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    if (!card.labelIds) return
    await ctx.db.patch(args.cardId, {
      labelIds: card.labelIds.filter((id) => id !== args.labelId),
    })
  },
})
