import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query('automationRules')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    trigger: v.string(),
    actions: v.array(v.string()),
    boardId: v.optional(v.id('boards')),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    return await ctx.db.insert('automationRules', {
      ownerId: user._id,
      name: args.name,
      trigger: args.trigger,
      actions: args.actions,
      boardId: args.boardId,
      enabled: true,
      runCount: 0,
    })
  },
})

export const update = mutation({
  args: {
    ruleId: v.id('automationRules'),
    name: v.optional(v.string()),
    trigger: v.optional(v.string()),
    actions: v.optional(v.array(v.string())),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const rule = await ctx.db.get(args.ruleId)
    if (!rule || rule.ownerId !== user._id) throw new Error('Unauthorized')
    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.trigger !== undefined) patch.trigger = args.trigger
    if (args.actions !== undefined) patch.actions = args.actions
    if (args.enabled !== undefined) patch.enabled = args.enabled
    await ctx.db.patch(args.ruleId, patch)
  },
})

export const toggle = mutation({
  args: { ruleId: v.id('automationRules') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const rule = await ctx.db.get(args.ruleId)
    if (!rule || rule.ownerId !== user._id) throw new Error('Unauthorized')
    await ctx.db.patch(args.ruleId, { enabled: !rule.enabled })
  },
})

export const remove = mutation({
  args: { ruleId: v.id('automationRules') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const rule = await ctx.db.get(args.ruleId)
    if (!rule || rule.ownerId !== user._id) throw new Error('Unauthorized')
    await ctx.db.delete(args.ruleId)
  },
})
