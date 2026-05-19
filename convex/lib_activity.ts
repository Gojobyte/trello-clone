import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { authComponent } from './auth'

// Enregistre une action dans le feed d'activité du board.
// À appeler dans toutes les mutations qui modifient des cards / lists / etc.
export async function recordActivity(
  ctx: MutationCtx,
  args: {
    boardId: Id<'boards'>
    cardId?: Id<'cards'>
    action: string
    details?: string
  },
) {
  const user = await authComponent.getAuthUser(ctx)
  if (!user) return // pas d'auth, on ne log pas
  const userName =
    (user as { name?: string }).name ??
    (user as { email?: string }).email ??
    'Anonyme'
  await ctx.db.insert('activity', {
    boardId: args.boardId,
    cardId: args.cardId,
    userId: user._id,
    userName,
    action: args.action,
    details: args.details,
  })
}
