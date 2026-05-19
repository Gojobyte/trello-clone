import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireBoardAccess } from './lib_board_access'
import type { Id } from './_generated/dataModel'
import type { QueryCtx, MutationCtx } from './_generated/server'

async function authCard(
  ctx: QueryCtx | MutationCtx,
  cardId: Id<'cards'>,
) {
  const card = await ctx.db.get(cardId)
  if (!card) throw new Error('Card not found')
  await requireBoardAccess(ctx, card.boardId)
  return card
}

export const listForCard = query({
  args: { cardId: v.id('cards') },
  handler: async (ctx, args) => {
    await authCard(ctx, args.cardId)
    return await ctx.db
      .query('checklistItems')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .collect()
  },
})

export const add = mutation({
  args: {
    cardId: v.id('cards'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await authCard(ctx, args.cardId)
    const existing = await ctx.db
      .query('checklistItems')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .collect()
    const position =
      existing.length === 0
        ? 1000
        : Math.max(...existing.map((c) => c.position)) + 1000
    return await ctx.db.insert('checklistItems', {
      cardId: args.cardId,
      text: args.text,
      checked: false,
      position,
    })
  },
})

export const toggle = mutation({
  args: { itemId: v.id('checklistItems') },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error('Item not found')
    await authCard(ctx, item.cardId)
    await ctx.db.patch(args.itemId, { checked: !item.checked })
  },
})

export const updateText = mutation({
  args: { itemId: v.id('checklistItems'), text: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error('Item not found')
    await authCard(ctx, item.cardId)
    await ctx.db.patch(args.itemId, { text: args.text })
  },
})

export const remove = mutation({
  args: { itemId: v.id('checklistItems') },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error('Item not found')
    await authCard(ctx, item.cardId)
    await ctx.db.delete(args.itemId)
  },
})
