import type { QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

// Rassemble tous les boards accessibles par un utilisateur :
// boards possédés + boards membre direct + boards via workspace.
export async function collectAccessibleBoards(
  ctx: QueryCtx,
  userId: string,
): Promise<Map<Id<'boards'>, Doc<'boards'>>> {
  const map = new Map<Id<'boards'>, Doc<'boards'>>()

  const owned = await ctx.db
    .query('boards')
    .withIndex('by_owner', (q) => q.eq('ownerId', userId))
    .collect()
  for (const b of owned) map.set(b._id, b)

  const boardMemberships = await ctx.db
    .query('boardMembers')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect()
  for (const m of boardMemberships) {
    if (map.has(m.boardId)) continue
    const b = await ctx.db.get(m.boardId)
    if (b) map.set(b._id, b)
  }

  const wsMemberships = await ctx.db
    .query('workspaceMembers')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect()
  for (const wm of wsMemberships) {
    const boards = await ctx.db
      .query('boards')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', wm.workspaceId))
      .collect()
    for (const b of boards) {
      if (!map.has(b._id)) map.set(b._id, b)
    }
  }

  return map
}
