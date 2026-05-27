import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'

const statusValidator = v.union(
  v.literal('active'),
  v.literal('planned'),
  v.literal('completed'),
)

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query('sprints')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    goal: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    committed: v.number(),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    return await ctx.db.insert('sprints', {
      ownerId: user._id,
      name: args.name,
      goal: args.goal,
      startDate: args.startDate,
      endDate: args.endDate,
      committed: args.committed,
      completed: 0,
      status: args.status ?? 'planned',
    })
  },
})

export const update = mutation({
  args: {
    sprintId: v.id('sprints'),
    name: v.optional(v.string()),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    committed: v.optional(v.number()),
    completed: v.optional(v.number()),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const sprint = await ctx.db.get(args.sprintId)
    if (!sprint || sprint.ownerId !== user._id) throw new Error('Unauthorized')
    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.goal !== undefined) patch.goal = args.goal
    if (args.startDate !== undefined) patch.startDate = args.startDate
    if (args.endDate !== undefined) patch.endDate = args.endDate
    if (args.committed !== undefined) patch.committed = Math.max(0, args.committed)
    if (args.completed !== undefined) patch.completed = Math.max(0, args.completed)
    if (args.status !== undefined) patch.status = args.status
    await ctx.db.patch(args.sprintId, patch)
  },
})

export const remove = mutation({
  args: { sprintId: v.id('sprints') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const sprint = await ctx.db.get(args.sprintId)
    if (!sprint || sprint.ownerId !== user._id) throw new Error('Unauthorized')
    await ctx.db.delete(args.sprintId)
  },
})
