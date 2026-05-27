import { query } from './_generated/server'
import { requireUser } from './lib_auth'
import { collectAccessibleBoards } from './lib_my_boards'

// Toutes les cartes assignées à l'utilisateur, à travers tous ses tableaux.
// Sert d'alimentation aux onglets « Mon jour » / « Mes tâches » / « Vues ».
export const myCards = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const boards = await collectAccessibleBoards(ctx, user._id)

    const cards: Array<{
      _id: string
      title: string
      boardId: string
      boardName: string
      boardColor: string | undefined
      listName: string
      completed: boolean
      dueDate: number | null
      checklistDone: number
      checklistTotal: number
      labelCount: number
    }> = []

    for (const board of boards.values()) {
      const lists = await ctx.db
        .query('lists')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()
      const listName = new Map(lists.map((l) => [l._id, l.name]))

      const boardCards = await ctx.db
        .query('cards')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()

      for (const c of boardCards) {
        if (c.archived) continue
        if (!(c.memberIds ?? []).includes(user._id)) continue
        const checklist = await ctx.db
          .query('checklistItems')
          .withIndex('by_card', (q) => q.eq('cardId', c._id))
          .collect()
        cards.push({
          _id: c._id,
          title: c.title,
          boardId: board._id,
          boardName: board.name,
          boardColor: board.color,
          listName: listName.get(c.listId) ?? '',
          completed: c.completed ?? false,
          dueDate: c.dueDate ?? null,
          checklistDone: checklist.filter((i) => i.checked).length,
          checklistTotal: checklist.length,
          labelCount: (c.labelIds ?? []).length,
        })
      }
    }

    return cards
  },
})

// Compteurs synthétiques pour les badges de la sidebar.
export const counts = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const boards = await collectAccessibleBoards(ctx, user._id)
    const now = Date.now()
    const endOfWeek = now + 7 * 86400000

    let tasks = 0
    let today = 0
    for (const board of boards.values()) {
      const boardCards = await ctx.db
        .query('cards')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()
      for (const c of boardCards) {
        if (c.archived || c.completed) continue
        if (!(c.memberIds ?? []).includes(user._id)) continue
        tasks++
        if (c.dueDate && c.dueDate <= endOfWeek) today++
      }
    }

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_and_read', (q) =>
        q.eq('userId', user._id).eq('read', false),
      )
      .collect()

    return { tasks, today, inbox: unread.length }
  },
})
