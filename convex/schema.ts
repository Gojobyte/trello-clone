import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Espace de travail qui regroupe plusieurs boards. Les membres d'un
  // workspace ont accès à tous les boards qu'il contient.
  workspaces: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    ownerId: v.string(),
  }).index('by_owner', ['ownerId']),

  workspaceMembers: defineTable({
    workspaceId: v.id('workspaces'),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    role: v.union(v.literal('owner'), v.literal('member')),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_user', ['userId'])
    .index('by_workspace_and_user', ['workspaceId', 'userId']),

  workspaceInvitations: defineTable({
    workspaceId: v.id('workspaces'),
    email: v.string(),
    invitedById: v.string(),
    invitedByName: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('declined'),
    ),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_email', ['email'])
    .index('by_workspace_and_email', ['workspaceId', 'email']),

  boards: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    backgroundImage: v.optional(v.string()),
    ownerId: v.string(),
    starred: v.optional(v.boolean()),
    // null/undefined = board orphelin (section "Sans espace")
    workspaceId: v.optional(v.id('workspaces')),
  })
    .index('by_owner', ['ownerId'])
    .index('by_workspace', ['workspaceId']),

  lists: defineTable({
    boardId: v.id('boards'),
    name: v.string(),
    position: v.number(),
    archived: v.optional(v.boolean()),
  }).index('by_board', ['boardId']),

  cards: defineTable({
    listId: v.id('lists'),
    boardId: v.id('boards'),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    completed: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
    dueDateCompleted: v.optional(v.boolean()),
    labelIds: v.optional(v.array(v.id('labels'))),
    memberIds: v.optional(v.array(v.string())),
    archived: v.optional(v.boolean()),
    coverColor: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    isTemplate: v.optional(v.boolean()),
  })
    .index('by_list', ['listId'])
    .index('by_board', ['boardId']),

  labels: defineTable({
    boardId: v.id('boards'),
    color: v.string(),
    text: v.optional(v.string()),
  }).index('by_board', ['boardId']),

  checklistItems: defineTable({
    cardId: v.id('cards'),
    text: v.string(),
    checked: v.boolean(),
    position: v.number(),
  }).index('by_card', ['cardId']),

  comments: defineTable({
    cardId: v.id('cards'),
    authorId: v.string(),
    authorName: v.string(),
    text: v.string(),
  }).index('by_card', ['cardId']),

  attachments: defineTable({
    cardId: v.id('cards'),
    boardId: v.id('boards'),
    name: v.string(),
    storageId: v.id('_storage'),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
    uploaderId: v.string(),
    uploaderName: v.string(),
  })
    .index('by_card', ['cardId'])
    .index('by_board', ['boardId']),

  activity: defineTable({
    boardId: v.id('boards'),
    cardId: v.optional(v.id('cards')),
    userId: v.string(),
    userName: v.string(),
    // Codé : 'card.create', 'card.rename', 'card.move', 'card.archive', 'card.delete',
    // 'comment.add', 'attachment.add', 'list.create', 'list.archive', etc.
    action: v.string(),
    details: v.optional(v.string()),
  })
    .index('by_board', ['boardId'])
    .index('by_card', ['cardId']),

  // Membres d'un board (un user par row). L'owner est aussi présent ici (role='owner')
  // pour simplifier les checks d'accès.
  boardMembers: defineTable({
    boardId: v.id('boards'),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    role: v.union(v.literal('owner'), v.literal('member')),
  })
    .index('by_board', ['boardId'])
    .index('by_user', ['userId'])
    .index('by_board_and_user', ['boardId', 'userId']),

  // Invitations en attente : on accepte qu'un email pointe vers un compte
  // qui n'existe pas encore. Au login/register avec cet email,
  // on convertit l'invitation en boardMembers.
  boardInvitations: defineTable({
    boardId: v.id('boards'),
    email: v.string(),
    invitedById: v.string(),
    invitedByName: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('declined'),
    ),
  })
    .index('by_board', ['boardId'])
    .index('by_email', ['email'])
    .index('by_board_and_email', ['boardId', 'email']),

  // Notifications in-app (mention, assignation, due date approche, etc.)
  notifications: defineTable({
    userId: v.string(),
    // Codes : 'mention.comment', 'card.assigned', 'card.unassigned',
    //         'invitation.received'
    type: v.string(),
    boardId: v.optional(v.id('boards')),
    cardId: v.optional(v.id('cards')),
    actorName: v.string(),
    message: v.string(),
    read: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_read', ['userId', 'read']),
})
