import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireUser } from './lib_auth'

// Crée un vrai tableau (board + listes + cartes) à partir d'un modèle.
// La structure du modèle est fournie par le client (catalogue côté front).
export const createFromTemplate = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    lists: v.array(
      v.object({
        name: v.string(),
        cards: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    // S'assurer qu'un espace de travail existe.
    const existingWs = await ctx.db
      .query('workspaces')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .first()
    let workspaceId = existingWs?._id
    if (!workspaceId) {
      workspaceId = await ctx.db.insert('workspaces', {
        name: 'Mon espace',
        color: 'indigo',
        ownerId: user._id,
      })
      await ctx.db.insert('workspaceMembers', {
        workspaceId,
        userId: user._id,
        userEmail: user.email ?? '',
        userName: user.name ?? user.email ?? 'Moi',
        role: 'owner',
      })
    }

    const boardId = await ctx.db.insert('boards', {
      name: args.name,
      color: args.color,
      ownerId: user._id,
      workspaceId,
    })
    await ctx.db.insert('boardMembers', {
      boardId,
      userId: user._id,
      userEmail: user.email ?? '',
      userName: user.name ?? user.email ?? 'Moi',
      role: 'owner',
    })

    let listPos = 1000
    for (const list of args.lists) {
      const listId = await ctx.db.insert('lists', {
        boardId,
        name: list.name,
        position: listPos,
      })
      listPos += 1000
      let cardPos = 1000
      for (const cardTitle of list.cards) {
        if (!cardTitle.trim()) continue
        await ctx.db.insert('cards', {
          listId,
          boardId,
          title: cardTitle,
          position: cardPos,
        })
        cardPos += 1000
      }
    }

    return boardId
  },
})
