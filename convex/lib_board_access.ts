import type { QueryCtx, MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { requireUser } from './lib_auth'

export type BoardAccess = {
  user: Awaited<ReturnType<typeof requireUser>>
  board: Doc<'boards'>
  role: 'owner' | 'member'
}

// Vérifie que l'utilisateur connecté a accès au board (owner, member direct
// OU member du workspace qui contient le board).
export async function requireBoardAccess(
  ctx: QueryCtx | MutationCtx,
  boardId: Id<'boards'>,
): Promise<BoardAccess> {
  const user = await requireUser(ctx)
  const board = await ctx.db.get(boardId)
  if (!board) {
    throw new Error('Board not found')
  }
  if (board.ownerId === user._id) {
    return { user, board, role: 'owner' }
  }
  // Membre direct du board ?
  const membership = await ctx.db
    .query('boardMembers')
    .withIndex('by_board_and_user', (q) =>
      q.eq('boardId', boardId).eq('userId', user._id),
    )
    .unique()
  if (membership) {
    return { user, board, role: membership.role }
  }
  // Membre du workspace qui contient le board ?
  if (board.workspaceId) {
    const wsMembership = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspace_and_user', (q) =>
        q.eq('workspaceId', board.workspaceId!).eq('userId', user._id),
      )
      .unique()
    if (wsMembership) {
      return { user, board, role: wsMembership.role }
    }
  }
  throw new Error('Unauthorized')
}

// Variante stricte : refuse les membres non-owners. Utiliser pour
// actions sensibles (supprimer le board, gérer les membres).
export async function requireBoardOwner(
  ctx: QueryCtx | MutationCtx,
  boardId: Id<'boards'>,
): Promise<BoardAccess> {
  const access = await requireBoardAccess(ctx, boardId)
  if (access.role !== 'owner') {
    throw new Error('Only the board owner can perform this action')
  }
  return access
}
