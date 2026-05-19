import type { QueryCtx, MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { requireUser } from './lib_auth'

export type WorkspaceAccess = {
  user: Awaited<ReturnType<typeof requireUser>>
  workspace: Doc<'workspaces'>
  role: 'owner' | 'member'
}

// Owner ou member du workspace
export async function requireWorkspaceAccess(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>,
): Promise<WorkspaceAccess> {
  const user = await requireUser(ctx)
  const workspace = await ctx.db.get(workspaceId)
  if (!workspace) throw new Error('Workspace not found')
  if (workspace.ownerId === user._id) {
    return { user, workspace, role: 'owner' }
  }
  const membership = await ctx.db
    .query('workspaceMembers')
    .withIndex('by_workspace_and_user', (q) =>
      q.eq('workspaceId', workspaceId).eq('userId', user._id),
    )
    .unique()
  if (!membership) throw new Error('Unauthorized')
  return { user, workspace, role: membership.role }
}

// Owner uniquement (pour delete, gérer membres, etc.)
export async function requireWorkspaceOwner(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>,
): Promise<WorkspaceAccess> {
  const access = await requireWorkspaceAccess(ctx, workspaceId)
  if (access.role !== 'owner') {
    throw new Error('Only the workspace owner can perform this action')
  }
  return access
}
