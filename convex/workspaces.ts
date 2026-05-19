import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUser } from './lib_auth'
import {
  requireWorkspaceAccess,
  requireWorkspaceOwner,
} from './lib_workspace_access'

// Liste les workspaces où le user est owner OU member
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const owned = await ctx.db
      .query('workspaces')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .collect()
    const memberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    const memberWorkspaces = await Promise.all(
      memberships
        .filter((m) => m.role !== 'owner')
        .map(async (m) => {
          const w = await ctx.db.get(m.workspaceId)
          return w ? { ...w, _isMember: true as const } : null
        }),
    )
    const filtered = memberWorkspaces.filter(
      (w): w is NonNullable<typeof w> => w !== null,
    )
    return [...owned, ...filtered]
  },
})

export const get = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    try {
      const { workspace } = await requireWorkspaceAccess(ctx, args.workspaceId)
      const boards = await ctx.db
        .query('boards')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
        .collect()
      return { workspace, boards }
    } catch {
      return null
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const workspaceId = await ctx.db.insert('workspaces', {
      name: args.name,
      description: args.description,
      color: args.color,
      ownerId: user._id,
    })
    await ctx.db.insert('workspaceMembers', {
      workspaceId,
      userId: user._id,
      userEmail: user.email ?? '',
      userName: user.name ?? user.email ?? 'Moi',
      role: 'owner',
    })
    return workspaceId
  },
})

export const rename = mutation({
  args: { workspaceId: v.id('workspaces'), name: v.string() },
  handler: async (ctx, args) => {
    await requireWorkspaceAccess(ctx, args.workspaceId)
    await ctx.db.patch(args.workspaceId, { name: args.name })
  },
})

export const updateDescription = mutation({
  args: { workspaceId: v.id('workspaces'), description: v.string() },
  handler: async (ctx, args) => {
    await requireWorkspaceAccess(ctx, args.workspaceId)
    await ctx.db.patch(args.workspaceId, { description: args.description })
  },
})

// Supprime le workspace (les boards deviennent orphelins, pas supprimés)
export const remove = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId)
    // Détacher les boards (workspaceId → undefined)
    const boards = await ctx.db
      .query('boards')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    for (const b of boards) {
      await ctx.db.patch(b._id, { workspaceId: undefined })
    }
    // Supprimer membres et invitations
    const members = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    for (const m of members) {
      await ctx.db.delete(m._id)
    }
    const invitations = await ctx.db
      .query('workspaceInvitations')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    for (const i of invitations) {
      await ctx.db.delete(i._id)
    }
    await ctx.db.delete(args.workspaceId)
  },
})
