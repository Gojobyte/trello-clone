import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'
import { requireBoardAccess } from './lib_board_access'
import { recordActivity } from './lib_activity'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const add = mutation({
  args: {
    cardId: v.id('cards'),
    storageId: v.id('_storage'),
    name: v.string(),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    const { user } = await requireBoardAccess(ctx, card.boardId)
    const uploaderName =
      (user as { name?: string }).name ??
      (user as { email?: string }).email ??
      'Anonyme'
    const id = await ctx.db.insert('attachments', {
      cardId: args.cardId,
      boardId: card.boardId,
      name: args.name,
      storageId: args.storageId,
      contentType: args.contentType,
      size: args.size,
      uploaderId: user._id,
      uploaderName,
    })
    await recordActivity(ctx, {
      boardId: card.boardId,
      cardId: args.cardId,
      action: 'attachment.add',
      details: args.name,
    })
    return id
  },
})

export const listForCard = query({
  args: { cardId: v.id('cards') },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    const items = await ctx.db
      .query('attachments')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .order('desc')
      .collect()
    return await Promise.all(
      items.map(async (a) => ({
        ...a,
        url: await ctx.storage.getUrl(a.storageId),
      })),
    )
  },
})

export const remove = mutation({
  args: { attachmentId: v.id('attachments') },
  handler: async (ctx, args) => {
    const att = await ctx.db.get(args.attachmentId)
    if (!att) throw new Error('Attachment not found')
    await requireBoardAccess(ctx, att.boardId)
    await ctx.storage.delete(att.storageId)
    await ctx.db.delete(args.attachmentId)
    await recordActivity(ctx, {
      boardId: att.boardId,
      cardId: att.cardId,
      action: 'attachment.remove',
      details: att.name,
    })
  },
})
