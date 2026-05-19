import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'
import { requireBoardAccess } from './lib_board_access'
import { recordActivity } from './lib_activity'
import { pushNotification } from './notifications'

export const listForCard = query({
  args: { cardId: v.id('cards') },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    return await ctx.db
      .query('comments')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .order('desc')
      .collect()
  },
})

export const add = mutation({
  args: {
    cardId: v.id('cards'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    const { user } = await requireBoardAccess(ctx, card.boardId)
    const text = args.text.trim()
    if (!text) throw new Error('Comment text required')
    const authorName =
      (user as { name?: string }).name ??
      (user as { email?: string }).email ??
      'Anonyme'
    const id = await ctx.db.insert('comments', {
      cardId: args.cardId,
      authorId: user._id,
      authorName,
      text,
    })
    await recordActivity(ctx, {
      boardId: card.boardId,
      cardId: args.cardId,
      action: 'comment.add',
      details: text.length > 80 ? `${text.slice(0, 80)}...` : text,
    })
    // Détecter les @mentions et créer des notifs pour les membres mentionnés
    const members = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', card.boardId))
      .collect()
    const notified = new Set<string>()
    for (const m of members) {
      if (m.userId === user._id) continue // pas de notif à soi-même
      // Cherche `@MemberName` (avec frontière de mot)
      const escaped = m.userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`@${escaped}\\b`)
      if (regex.test(text) && !notified.has(m.userId)) {
        notified.add(m.userId)
        await pushNotification(ctx, {
          userId: m.userId,
          type: 'mention.comment',
          boardId: card.boardId,
          cardId: args.cardId,
          actorName: authorName,
          message: `${authorName} vous a mentionné dans « ${card.title} »`,
        })
      }
    }
    return id
  },
})

export const update = mutation({
  args: {
    commentId: v.id('comments'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new Error('Comment not found')
    if (comment.authorId !== user._id) {
      throw new Error('Only the author can edit')
    }
    const text = args.text.trim()
    if (!text) throw new Error('Comment text required')
    await ctx.db.patch(args.commentId, { text })
  },
})

export const remove = mutation({
  args: { commentId: v.id('comments') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new Error('Comment not found')
    // Soit l'auteur, soit owner du board peut supprimer
    if (comment.authorId !== user._id) {
      const card = await ctx.db.get(comment.cardId)
      if (!card) throw new Error('Card not found')
      const board = await ctx.db.get(card.boardId)
      if (!board || board.ownerId !== user._id) {
        throw new Error('Unauthorized')
      }
    }
    await ctx.db.delete(args.commentId)
  },
})
