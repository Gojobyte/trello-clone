import { query } from './_generated/server'
import { requireUser } from './lib_auth'
import { collectAccessibleBoards } from './lib_my_boards'

// Charge de travail réelle par membre, agrégée sur tous les tableaux accessibles.
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const boards = await collectAccessibleBoards(ctx, user._id)
    const now = Date.now()
    const endOfWeek = now + 7 * 86400000

    // Nom des membres connus (depuis boardMembers).
    const memberName = new Map<string, string>()
    type Stat = {
      userId: string
      name: string
      open: number
      overdue: number
      dueThisWeek: number
      completed: number
    }
    const stats = new Map<string, Stat>()

    function stat(userId: string): Stat {
      let s = stats.get(userId)
      if (!s) {
        s = {
          userId,
          name: memberName.get(userId) ?? 'Membre',
          open: 0,
          overdue: 0,
          dueThisWeek: 0,
          completed: 0,
        }
        stats.set(userId, s)
      }
      return s
    }

    let unassignedOpen = 0
    let totalCards = 0

    for (const board of boards.values()) {
      const members = await ctx.db
        .query('boardMembers')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()
      for (const m of members) memberName.set(m.userId, m.userName)
    }

    for (const board of boards.values()) {
      const boardCards = await ctx.db
        .query('cards')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()
      for (const c of boardCards) {
        if (c.archived) continue
        totalCards++
        const assignees = c.memberIds ?? []
        if (assignees.length === 0) {
          if (!c.completed) unassignedOpen++
          continue
        }
        for (const uid of assignees) {
          const s = stat(uid)
          if (c.completed) {
            s.completed++
          } else {
            s.open++
            if (c.dueDate && c.dueDate < now) s.overdue++
            else if (c.dueDate && c.dueDate <= endOfWeek) s.dueThisWeek++
          }
        }
      }
    }

    const members = [...stats.values()].sort((a, b) => b.open - a.open)
    return {
      members,
      unassignedOpen,
      totalCards,
      boardCount: boards.size,
    }
  },
})
