import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireBoardAccess } from './lib_board_access'

export const listForCard = query({
  args: { cardId: v.id('cards') },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    return await ctx.db
      .query('activity')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .order('desc')
      .take(50)
  },
})

export const listForBoard = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    return await ctx.db
      .query('activity')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .order('desc')
      .take(100)
  },
})
