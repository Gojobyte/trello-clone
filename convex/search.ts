import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireUser } from './lib_auth'
import type { Doc } from './_generated/dataModel'

// Recherche globale : parcourt tous les tableaux accessibles par l'utilisateur
// et remonte les tableaux + cartes dont le titre/description contient le terme.
export const globalSearch = query({
  args: { term: v.string() },
  handler: async (ctx, { term }) => {
    const user = await requireUser(ctx)
    const q = term.trim().toLowerCase()
    if (q.length < 2) {
      return { boards: [], cards: [] }
    }

    // Collecte des tableaux accessibles (même logique que boards.listMine).
    const boardMap = new Map<string, Doc<'boards'>>()

    const owned = await ctx.db
      .query('boards')
      .withIndex('by_owner', (x) => x.eq('ownerId', user._id))
      .collect()
    for (const b of owned) boardMap.set(b._id, b)

    const boardMemberships = await ctx.db
      .query('boardMembers')
      .withIndex('by_user', (x) => x.eq('userId', user._id))
      .collect()
    for (const m of boardMemberships) {
      if (boardMap.has(m.boardId)) continue
      const b = await ctx.db.get(m.boardId)
      if (b) boardMap.set(b._id, b)
    }

    const wsMemberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_user', (x) => x.eq('userId', user._id))
      .collect()
    for (const wm of wsMemberships) {
      const boards = await ctx.db
        .query('boards')
        .withIndex('by_workspace', (x) => x.eq('workspaceId', wm.workspaceId))
        .collect()
      for (const b of boards) {
        if (!boardMap.has(b._id)) boardMap.set(b._id, b)
      }
    }

    // Tableaux dont le nom correspond.
    const boards = [...boardMap.values()]
      .filter((b) => b.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map((b) => ({
        _id: b._id,
        name: b.name,
        color: b.color,
        backgroundImage: b.backgroundImage,
      }))

    // Cartes dont le titre ou la description correspond.
    const cards: Array<{
      _id: string
      title: string
      boardId: string
      boardName: string
      completed: boolean
    }> = []
    for (const b of boardMap.values()) {
      if (cards.length >= 24) break
      const boardCards = await ctx.db
        .query('cards')
        .withIndex('by_board', (x) => x.eq('boardId', b._id))
        .collect()
      for (const c of boardCards) {
        if (c.archived) continue
        const hit =
          c.title.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false)
        if (hit) {
          cards.push({
            _id: c._id,
            title: c.title,
            boardId: b._id,
            boardName: b.name,
            completed: c.completed ?? false,
          })
          if (cards.length >= 24) break
        }
      }
    }

    return { boards, cards }
  },
})
