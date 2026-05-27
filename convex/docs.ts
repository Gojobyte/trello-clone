import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'

// Liste les pages de doc de l'utilisateur (les plus récentes d'abord).
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query('docs')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .collect()
  },
})

export const get = query({
  args: { docId: v.id('docs') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const doc = await ctx.db.get(args.docId)
    if (!doc || doc.ownerId !== user._id) return null
    return doc
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    emoji: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    return await ctx.db.insert('docs', {
      ownerId: user._id,
      title: args.title || 'Page sans titre',
      emoji: args.emoji || '📄',
      content: args.content || '',
      updatedByName: user.name ?? user.email ?? 'Moi',
    })
  },
})

export const update = mutation({
  args: {
    docId: v.id('docs'),
    title: v.optional(v.string()),
    emoji: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const doc = await ctx.db.get(args.docId)
    if (!doc || doc.ownerId !== user._id) throw new Error('Unauthorized')
    const patch: Record<string, unknown> = {
      updatedByName: user.name ?? user.email ?? 'Moi',
    }
    if (args.title !== undefined) patch.title = args.title
    if (args.emoji !== undefined) patch.emoji = args.emoji
    if (args.content !== undefined) patch.content = args.content
    await ctx.db.patch(args.docId, patch)
  },
})

export const remove = mutation({
  args: { docId: v.id('docs') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const doc = await ctx.db.get(args.docId)
    if (!doc || doc.ownerId !== user._id) throw new Error('Unauthorized')
    await ctx.db.delete(args.docId)
  },
})
