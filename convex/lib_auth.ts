import type { QueryCtx, MutationCtx } from './_generated/server'
import { authComponent } from './auth'

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await authComponent.getAuthUser(ctx)
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}
