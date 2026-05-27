import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'

const statusValidator = v.union(
  v.literal('on_track'),
  v.literal('at_risk'),
  v.literal('off_track'),
)

// Liste les objectifs de l'utilisateur, chacun avec ses résultats clés.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .collect()
    const result = []
    for (const g of goals) {
      const keyResults = await ctx.db
        .query('keyResults')
        .withIndex('by_goal', (q) => q.eq('goalId', g._id))
        .collect()
      result.push({ ...g, keyResults })
    }
    return result
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    quarter: v.string(),
    color: v.string(),
    keyResults: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const goalId = await ctx.db.insert('goals', {
      ownerId: user._id,
      title: args.title,
      quarter: args.quarter,
      color: args.color,
      status: 'on_track',
    })
    for (const kr of args.keyResults ?? []) {
      if (kr.trim()) {
        await ctx.db.insert('keyResults', {
          goalId,
          ownerId: user._id,
          title: kr.trim(),
          progress: 0,
        })
      }
    }
    return goalId
  },
})

export const update = mutation({
  args: {
    goalId: v.id('goals'),
    title: v.optional(v.string()),
    quarter: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const goal = await ctx.db.get(args.goalId)
    if (!goal || goal.ownerId !== user._id) throw new Error('Unauthorized')
    const patch: Record<string, unknown> = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.quarter !== undefined) patch.quarter = args.quarter
    if (args.color !== undefined) patch.color = args.color
    if (args.status !== undefined) patch.status = args.status
    await ctx.db.patch(args.goalId, patch)
  },
})

export const remove = mutation({
  args: { goalId: v.id('goals') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const goal = await ctx.db.get(args.goalId)
    if (!goal || goal.ownerId !== user._id) throw new Error('Unauthorized')
    const krs = await ctx.db
      .query('keyResults')
      .withIndex('by_goal', (q) => q.eq('goalId', args.goalId))
      .collect()
    for (const kr of krs) await ctx.db.delete(kr._id)
    await ctx.db.delete(args.goalId)
  },
})

export const addKeyResult = mutation({
  args: { goalId: v.id('goals'), title: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const goal = await ctx.db.get(args.goalId)
    if (!goal || goal.ownerId !== user._id) throw new Error('Unauthorized')
    return await ctx.db.insert('keyResults', {
      goalId: args.goalId,
      ownerId: user._id,
      title: args.title,
      progress: 0,
    })
  },
})

export const updateKeyResult = mutation({
  args: {
    keyResultId: v.id('keyResults'),
    title: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const kr = await ctx.db.get(args.keyResultId)
    if (!kr || kr.ownerId !== user._id) throw new Error('Unauthorized')
    const patch: Record<string, unknown> = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.progress !== undefined) {
      patch.progress = Math.max(0, Math.min(100, args.progress))
    }
    await ctx.db.patch(args.keyResultId, patch)
  },
})

export const removeKeyResult = mutation({
  args: { keyResultId: v.id('keyResults') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const kr = await ctx.db.get(args.keyResultId)
    if (!kr || kr.ownerId !== user._id) throw new Error('Unauthorized')
    await ctx.db.delete(args.keyResultId)
  },
})
