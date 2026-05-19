import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { requireBoardAccess } from './lib_board_access'
import { recordActivity } from './lib_activity'
import { pushNotification } from './notifications'

export const create = mutation({
  args: {
    listId: v.id('lists'),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId)
    if (!list) throw new Error('List not found')
    await requireBoardAccess(ctx, list.boardId)
    const existing = await ctx.db
      .query('cards')
      .withIndex('by_list', (q) => q.eq('listId', args.listId))
      .collect()
    const position =
      existing.length === 0
        ? 1000
        : Math.max(...existing.map((c) => c.position)) + 1000
    const cardId = await ctx.db.insert('cards', {
      listId: args.listId,
      boardId: list.boardId,
      title: args.title,
      description: args.description,
      position,
    })
    await recordActivity(ctx, {
      boardId: list.boardId,
      cardId,
      action: 'card.create',
      details: args.title,
    })
    return cardId
  },
})

// Duplique une carte (avec sa checklist mais sans commentaires/attachments)
export const duplicate = mutation({
  args: { cardId: v.id('cards') },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    const allInList = await ctx.db
      .query('cards')
      .withIndex('by_list', (q) => q.eq('listId', card.listId))
      .collect()
    const next = allInList
      .filter((c) => c.position > card.position)
      .sort((a, b) => a.position - b.position)[0]
    const newPos = next
      ? (card.position + next.position) / 2
      : card.position + 1000
    const newCardId = await ctx.db.insert('cards', {
      listId: card.listId,
      boardId: card.boardId,
      title: `${card.title} (copie)`,
      description: card.description,
      position: newPos,
      labelIds: card.labelIds,
      coverColor: card.coverColor,
      coverImage: card.coverImage,
      dueDate: card.dueDate,
    })
    // Dupliquer la checklist (non cochée)
    const items = await ctx.db
      .query('checklistItems')
      .withIndex('by_card', (q) => q.eq('cardId', card._id))
      .collect()
    for (const item of items) {
      await ctx.db.insert('checklistItems', {
        cardId: newCardId,
        text: item.text,
        checked: false,
        position: item.position,
      })
    }
    await recordActivity(ctx, {
      boardId: card.boardId,
      cardId: newCardId,
      action: 'card.duplicate',
      details: card.title,
    })
    return newCardId
  },
})

export const update = mutation({
  args: {
    cardId: v.id('cards'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    // dueDate accepte null pour effacer la date côté client
    dueDate: v.optional(v.union(v.number(), v.null())),
    dueDateCompleted: v.optional(v.boolean()),
    // null pour retirer une couverture
    coverColor: v.optional(v.union(v.string(), v.null())),
    coverImage: v.optional(v.union(v.string(), v.null())),
    archived: v.optional(v.boolean()),
    memberIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    const { user } = await requireBoardAccess(ctx, card.boardId)
    const patch: Record<string, unknown> = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.description !== undefined) patch.description = args.description
    if (args.completed !== undefined) patch.completed = args.completed
    if (args.dueDate !== undefined)
      patch.dueDate = args.dueDate === null ? undefined : args.dueDate
    if (args.dueDateCompleted !== undefined)
      patch.dueDateCompleted = args.dueDateCompleted
    if (args.coverColor !== undefined)
      patch.coverColor = args.coverColor === null ? undefined : args.coverColor
    if (args.coverImage !== undefined)
      patch.coverImage = args.coverImage === null ? undefined : args.coverImage
    if (args.archived !== undefined) patch.archived = args.archived
    if (args.memberIds !== undefined) patch.memberIds = args.memberIds
    await ctx.db.patch(args.cardId, patch)
    // Activity tracking pour les changements significatifs
    if (args.title !== undefined && args.title !== card.title) {
      await recordActivity(ctx, {
        boardId: card.boardId,
        cardId: card._id,
        action: 'card.rename',
        details: `${card.title} → ${args.title}`,
      })
    }
    if (args.archived === true && !card.archived) {
      await recordActivity(ctx, {
        boardId: card.boardId,
        cardId: card._id,
        action: 'card.archive',
        details: card.title,
      })
    }
    // Notif sur ajout de membre à la carte
    if (args.memberIds !== undefined) {
      const before = new Set(card.memberIds ?? [])
      const after = new Set(args.memberIds)
      const actorName =
        (user as { name?: string }).name ??
        (user as { email?: string }).email ??
        'Quelqu\'un'
      // Ajouts : push notif
      for (const id of after) {
        if (!before.has(id) && id !== user._id) {
          await pushNotification(ctx, {
            userId: id,
            type: 'card.assigned',
            boardId: card.boardId,
            cardId: card._id,
            actorName,
            message: `${actorName} vous a assigné à « ${card.title} »`,
          })
        }
      }
    }
  },
})

// Liste les cartes archivées d'un tableau (pour le panel "Cartes archivées")
export const listArchived = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    await requireBoardAccess(ctx, args.boardId)
    const all = await ctx.db
      .query('cards')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    return all.filter((c) => c.archived === true)
  },
})

// Drag & drop : change la position d'une carte, et optionnellement sa liste
export const reorder = mutation({
  args: {
    cardId: v.id('cards'),
    listId: v.optional(v.id('lists')),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    const patch: { position: number; listId?: Id<'lists'> } = {
      position: args.position,
    }
    if (args.listId && args.listId !== card.listId) {
      const targetList = await ctx.db.get(args.listId)
      if (!targetList) throw new Error('Target list not found')
      if (targetList.boardId !== card.boardId) {
        throw new Error('Cannot move card to another board')
      }
      patch.listId = args.listId
    }
    await ctx.db.patch(args.cardId, patch)
    // Activity si on a changé de liste
    if (args.listId && args.listId !== card.listId) {
      const fromList = await ctx.db.get(card.listId)
      const toList = await ctx.db.get(args.listId)
      await recordActivity(ctx, {
        boardId: card.boardId,
        cardId: card._id,
        action: 'card.move',
        details: `${card.title} : ${fromList?.name ?? '?'} → ${toList?.name ?? '?'}`,
      })
    }
  },
})

export const moveToList = mutation({
  args: {
    cardId: v.id('cards'),
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    const targetList = await ctx.db.get(args.listId)
    if (!targetList) throw new Error('Target list not found')
    if (targetList.boardId !== card.boardId) {
      throw new Error('Cannot move card to a list on another board')
    }
    await requireBoardAccess(ctx, card.boardId)
    // Position = max + 1000 dans la liste cible (donc en bas)
    const targetCards = await ctx.db
      .query('cards')
      .withIndex('by_list', (q) => q.eq('listId', args.listId))
      .collect()
    const position =
      targetCards.length === 0
        ? 1000
        : Math.max(...targetCards.map((c) => c.position)) + 1000
    await ctx.db.patch(args.cardId, { listId: args.listId, position })
  },
})

export const remove = mutation({
  args: { cardId: v.id('cards') },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId)
    if (!card) throw new Error('Card not found')
    await requireBoardAccess(ctx, card.boardId)
    // Cascade : supprimer les checklistItems, commentaires et attachments de la carte
    const items = await ctx.db
      .query('checklistItems')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .collect()
    for (const item of items) {
      await ctx.db.delete(item._id)
    }
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .collect()
    for (const c of comments) {
      await ctx.db.delete(c._id)
    }
    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_card', (q) => q.eq('cardId', args.cardId))
      .collect()
    for (const a of attachments) {
      await ctx.storage.delete(a.storageId)
      await ctx.db.delete(a._id)
    }
    await ctx.db.delete(args.cardId)
    await recordActivity(ctx, {
      boardId: card.boardId,
      action: 'card.delete',
      details: card.title,
    })
  },
})
