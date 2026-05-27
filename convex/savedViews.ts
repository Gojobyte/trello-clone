import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query('savedViews')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    icon: v.optional(v.string()),
    filterPriority: v.optional(v.string()),
    filterDue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    return await ctx.db.insert('savedViews', {
      ownerId: user._id,
      name: args.name,
      icon: args.icon || 'eye',
      filterPriority: args.filterPriority,
      filterDue: args.filterDue,
    })
  },
})

export const remove = mutation({
  args: { viewId: v.id('savedViews') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const view = await ctx.db.get(args.viewId)
    if (!view || view.ownerId !== user._id) throw new Error('Unauthorized')
    await ctx.db.delete(args.viewId)
  },
})
