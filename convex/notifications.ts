import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { requireUser } from './lib_auth'

// Liste les notifications du user connecté (50 dernières), enrichies
// avec le nom du board et le titre de la carte (si présents)
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const raw = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50)
    return await Promise.all(
      raw.map(async (n) => {
        const board = n.boardId ? await ctx.db.get(n.boardId) : null
        const card = n.cardId ? await ctx.db.get(n.cardId) : null
        return {
          ...n,
          boardName: board?.name,
          cardTitle: card?.title,
        }
      }),
    )
  },
})

// Nombre de notifications non lues (pour le badge cloche)
export const countUnread = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_and_read', (q) =>
        q.eq('userId', user._id).eq('read', false),
      )
      .take(100)
    return unread.length
  },
})

export const markAsRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const notif = await ctx.db.get(args.notificationId)
    if (!notif || notif.userId !== user._id) {
      throw new Error('Notification not found')
    }
    if (!notif.read) {
      await ctx.db.patch(args.notificationId, { read: true })
    }
  },
})

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_and_read', (q) =>
        q.eq('userId', user._id).eq('read', false),
      )
      .take(100)
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true })
    }
  },
})

// Helper interne pour créer une notification (appelé depuis d'autres mutations)
export async function pushNotification(
  ctx: MutationCtx,
  args: {
    userId: string
    type: string
    boardId?: Id<'boards'>
    cardId?: Id<'cards'>
    actorName: string
    message: string
  },
) {
  await ctx.db.insert('notifications', {
    userId: args.userId,
    type: args.type,
    boardId: args.boardId,
    cardId: args.cardId,
    actorName: args.actorName,
    message: args.message,
    read: false,
  })
}
