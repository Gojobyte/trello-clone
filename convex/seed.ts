import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'
import { authComponent } from './auth'
import type { Id } from './_generated/dataModel'

// Purge toutes les données applicatives créées par un utilisateur
// (utilisé pour nettoyer un compte de test). Ne touche pas Better-Auth.
export const purgeOwner = internalMutation({
  args: { ownerId: v.string() },
  handler: async (ctx, { ownerId }) => {
    let deleted = 0
    const boards = await ctx.db
      .query('boards')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect()
    for (const board of boards) {
      const cards = await ctx.db
        .query('cards')
        .withIndex('by_board', (q) => q.eq('boardId', board._id))
        .collect()
      for (const card of cards) {
        const items = await ctx.db
          .query('checklistItems')
          .withIndex('by_card', (q) => q.eq('cardId', card._id))
          .collect()
        for (const it of items) await ctx.db.delete(it._id)
        const comments = await ctx.db
          .query('comments')
          .withIndex('by_card', (q) => q.eq('cardId', card._id))
          .collect()
        for (const c of comments) await ctx.db.delete(c._id)
        await ctx.db.delete(card._id)
        deleted++
      }
      for (const table of ['lists', 'labels', 'boardMembers'] as const) {
        const rows = await ctx.db
          .query(table)
          .withIndex('by_board', (q) => q.eq('boardId', board._id))
          .collect()
        for (const r of rows) await ctx.db.delete(r._id)
      }
      await ctx.db.delete(board._id)
    }
    const workspaces = await ctx.db
      .query('workspaces')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect()
    for (const ws of workspaces) {
      const members = await ctx.db
        .query('workspaceMembers')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', ws._id))
        .collect()
      for (const m of members) await ctx.db.delete(m._id)
      await ctx.db.delete(ws._id)
    }
    return { deletedCards: deleted, deletedBoards: boards.length }
  },
})

// Vérifie qu'un userId correspond bien à un compte Better-Auth.
export const whoami = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const u = await authComponent.getAnyUserById(ctx, userId)
    return u ? { id: userId, name: u.name, email: u.email } : null
  },
})

const DAY = 86_400_000

type SeedCard = {
  title: string
  description?: string
  labels?: string[]
  dueInDays?: number
  completed?: boolean
  checklist?: Array<[string, boolean]>
}

type SeedList = { name: string; cards: SeedCard[] }

const LIVRE: SeedCard[] = [
  {
    title: 'Tableaux Kanban & glisser-déposer',
    description: 'Colonnes et cartes déplaçables à la souris, sauvegarde instantanée.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: 'Listes, cartes & réordonnancement',
    description: 'Créer, renommer, archiver des listes et des cartes ; positions persistées.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: 'Étiquettes colorées',
    description: 'Huit couleurs avec libellé, filtrables sur le tableau.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: "Dates d'échéance",
    description: 'Échéance par carte, état terminé, mise en avant des retards.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: 'Listes de contrôle',
    description: 'Sous-tâches cochables avec barre de progression.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: 'Commentaires & mentions @',
    description: 'Fil de discussion par carte, mention d\'un membre qui reçoit une notification.',
    labels: ['Collaboration'],
    completed: true,
  },
  {
    title: 'Espaces de travail partagés',
    description: 'Regrouper des tableaux et donner accès à toute une équipe.',
    labels: ['Collaboration'],
    completed: true,
  },
  {
    title: 'Invitations par email',
    description: 'Inviter un collaborateur même s\'il n\'a pas encore de compte.',
    labels: ['Collaboration'],
    completed: true,
  },
  {
    title: 'Notifications in-app',
    description: 'Cloche avec mentions, assignations et invitations reçues.',
    labels: ['Collaboration'],
    completed: true,
  },
  {
    title: 'Vue Calendrier',
    description: 'Visualiser les cartes par échéance dans un calendrier mensuel.',
    labels: ['Vue & rapports'],
    completed: true,
  },
  {
    title: 'Vue Tableau (liste détaillée)',
    description: 'Toutes les cartes du tableau dans un tableau triable.',
    labels: ['Vue & rapports'],
    completed: true,
  },
  {
    title: 'Pièces jointes',
    description: 'Joindre des fichiers à une carte via le stockage Convex.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: 'Authentification & sessions',
    description: 'Inscription email/mot de passe, sessions sécurisées, cookies multi-sous-domaines.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: 'Page Paramètres du compte',
    description: 'Profil, changement de mot de passe, suppression de compte.',
    labels: ['Cœur de produit'],
    completed: true,
  },
  {
    title: 'Identité de marque Flowboard',
    description: 'Logo monogramme, favicon, landing et pages de connexion premium.',
    labels: ['Cœur de produit'],
    completed: true,
  },
]

const EN_COURS: SeedCard[] = [
  {
    title: "Refonte premium de l'interface",
    description: 'Aligner toute l\'app sur le nouveau langage visuel Flowboard.',
    labels: ['Cœur de produit'],
    dueInDays: 4,
    checklist: [
      ['Landing & pages de connexion', true],
      ['Logo & favicon', true],
      ['Page Paramètres', true],
      ['Page Tableaux (état vide premium)', true],
      ['Vue tableau & cartes', false],
    ],
  },
  {
    title: 'Modèles de tableaux',
    description: 'Démarrer un tableau depuis un modèle prêt à l\'emploi (sprint, perso, CRM léger).',
    labels: ['Cœur de produit'],
    dueInDays: 9,
  },
  {
    title: 'Recherche globale des cartes',
    description: 'Une barre de recherche qui parcourt toutes les cartes de tous les tableaux.',
    labels: ['Cœur de produit'],
    dueInDays: 7,
  },
  {
    title: 'Archivage & corbeille',
    description: 'Archiver cartes et listes, puis les restaurer depuis une corbeille.',
    labels: ['Cœur de produit'],
    dueInDays: 12,
  },
]

const PLANIFIE: SeedCard[] = [
  {
    title: 'Raccourcis clavier',
    description: 'Navigation et actions rapides au clavier (créer une carte, filtrer, ouvrir la recherche).',
    labels: ['Cœur de produit'],
  },
  {
    title: 'Export JSON / CSV',
    description: 'Exporter un tableau complet pour sauvegarde ou analyse externe.',
    labels: ['Intégration'],
  },
  {
    title: 'Mode sombre complet',
    description: 'Thème sombre cohérent sur toute l\'application, avec bascule dans les paramètres.',
    labels: ['Cœur de produit'],
  },
  {
    title: 'Champs personnalisés',
    description: 'Ajouter des champs (texte, nombre, menu, case) propres à chaque tableau.',
    labels: ['Cœur de produit'],
  },
  {
    title: 'Sous-tâches & dépendances',
    description: 'Lier des cartes entre elles : « bloque » / « dépend de ».',
    labels: ['Cœur de produit'],
  },
  {
    title: 'Vue Chronologie (Gantt)',
    description: 'Planifier les cartes sur une frise temporelle.',
    labels: ['Vue & rapports'],
  },
  {
    title: 'Tableau de bord & statistiques',
    description: 'Cartes par état, vélocité, échéances à risque, charge par membre.',
    labels: ['Vue & rapports'],
  },
  {
    title: 'Flowboard Pro : facturation & abonnement',
    description: 'Offre payante : tableaux illimités, automatisations, vues avancées.',
    labels: ['Flowboard Pro'],
  },
]

const IDEES: SeedCard[] = [
  {
    title: 'Automatisations (règles si/alors)',
    description: 'Ex. : « quand une carte passe en Terminé, cocher la date d\'échéance ».',
    labels: ['Flowboard Pro'],
  },
  {
    title: 'Assistant IA : résumé de carte',
    description: 'Résumer automatiquement une longue description ou un fil de commentaires.',
    labels: ['IA'],
  },
  {
    title: 'IA : générer des cartes depuis un brief',
    description: 'Coller un objectif, obtenir une liste de cartes structurées prêtes à trier.',
    labels: ['IA'],
  },
  {
    title: 'IA : suggestion de priorités',
    description: 'Proposer un ordre de traitement selon échéances et dépendances.',
    labels: ['IA'],
  },
  {
    title: 'Cartes récurrentes',
    description: 'Recréer automatiquement une carte chaque semaine / mois.',
    labels: ['Cœur de produit'],
  },
  {
    title: 'Suivi du temps passé',
    description: 'Chronomètre par carte et total par liste / par membre.',
    labels: ['Vue & rapports'],
  },
  {
    title: 'Intégration Slack',
    description: 'Notifier un canal Slack lors des changements importants.',
    labels: ['Intégration'],
  },
  {
    title: 'Intégration Google Calendar',
    description: 'Synchroniser les échéances des cartes avec un agenda Google.',
    labels: ['Intégration'],
  },
  {
    title: 'Intégration GitHub',
    description: 'Lier des issues / PR GitHub à des cartes et suivre leur état.',
    labels: ['Intégration'],
  },
  {
    title: 'Webhooks & API publique',
    description: 'Permettre aux développeurs de brancher Flowboard sur leurs outils.',
    labels: ['Intégration'],
  },
  {
    title: 'Import depuis Trello / Asana',
    description: 'Migrer ses tableaux existants en quelques clics.',
    labels: ['Intégration'],
  },
  {
    title: 'Application mobile iOS & Android',
    description: 'Une app native pour consulter et mettre à jour ses tableaux en déplacement.',
    labels: ['Mobile'],
  },
  {
    title: 'Mode hors-ligne',
    description: 'Consulter et modifier ses cartes sans connexion, synchroniser au retour.',
    labels: ['Mobile'],
  },
  {
    title: 'Connexion SSO (Google, GitHub)',
    description: 'Se connecter en un clic via un fournisseur d\'identité.',
    labels: ['Cœur de produit'],
  },
  {
    title: 'Double authentification (2FA)',
    description: 'Renforcer la sécurité des comptes avec un second facteur.',
    labels: ['Cœur de produit'],
  },
  {
    title: 'Partage public en lecture seule',
    description: 'Publier un tableau via un lien consultable sans compte.',
    labels: ['Collaboration'],
  },
  {
    title: 'Curseurs collaboratifs en temps réel',
    description: 'Voir où travaillent les autres membres, façon document partagé.',
    labels: ['Collaboration'],
  },
  {
    title: 'Rapports hebdomadaires par email',
    description: 'Un récap automatique de l\'avancement envoyé chaque lundi.',
    labels: ['Vue & rapports'],
  },
  {
    title: 'Power-Ups / extensions tierces',
    description: 'Une marketplace d\'extensions pour enrichir les tableaux.',
    labels: ['Flowboard Pro'],
  },
  {
    title: 'Fonds de tableau personnalisés',
    description: 'Photos, dégradés et couleurs de marque pour chaque tableau.',
    labels: ['Cœur de produit'],
  },
]

const LISTS: SeedList[] = [
  { name: 'Idées', cards: IDEES },
  { name: 'Planifié', cards: PLANIFIE },
  { name: 'En cours', cards: EN_COURS },
  { name: 'Livré', cards: LIVRE },
]

// Crée l'espace « Produit Flowboard » + le tableau « Roadmap Flowboard ».
export const seedRoadmap = internalMutation({
  args: {
    ownerId: v.string(),
    ownerName: v.string(),
    ownerEmail: v.string(),
  },
  handler: async (ctx, { ownerId, ownerName, ownerEmail }) => {
    // Idempotence : ne pas recréer si la roadmap existe déjà.
    const owned = await ctx.db
      .query('boards')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect()
    if (owned.some((b) => b.name === 'Roadmap Flowboard')) {
      return { skipped: true as const }
    }

    const workspaceId = await ctx.db.insert('workspaces', {
      name: 'Produit Flowboard',
      description: 'La fabrique de Flowboard : ce qu\'on construit et pourquoi.',
      color: 'sky',
      ownerId,
    })
    await ctx.db.insert('workspaceMembers', {
      workspaceId,
      userId: ownerId,
      userEmail: ownerEmail,
      userName: ownerName,
      role: 'owner',
    })

    const boardId = await ctx.db.insert('boards', {
      name: 'Roadmap Flowboard',
      description:
        "Ce qui est livré, ce qui arrive, et tout ce qu'on aimerait construire.",
      color: 'indigo',
      ownerId,
      workspaceId,
      starred: true,
    })
    await ctx.db.insert('boardMembers', {
      boardId,
      userId: ownerId,
      userEmail: ownerEmail,
      userName: ownerName,
      role: 'owner',
    })

    const labelColors: Record<string, string> = {
      'Cœur de produit': 'sky',
      IA: 'purple',
      Collaboration: 'green',
      Intégration: 'orange',
      'Vue & rapports': 'lime',
      Mobile: 'pink',
      'Flowboard Pro': 'red',
    }
    const labelIds: Record<string, Id<'labels'>> = {}
    for (const [text, color] of Object.entries(labelColors)) {
      labelIds[text] = await ctx.db.insert('labels', { boardId, color, text })
    }

    const now = Date.now()
    let cardCount = 0
    for (let li = 0; li < LISTS.length; li++) {
      const list = LISTS[li]
      const listId = await ctx.db.insert('lists', {
        boardId,
        name: list.name,
        position: li,
      })
      for (let ci = 0; ci < list.cards.length; ci++) {
        const c = list.cards[ci]
        const cardId = await ctx.db.insert('cards', {
          listId,
          boardId,
          title: c.title,
          description: c.description,
          position: ci,
          completed: c.completed,
          dueDate:
            c.dueInDays !== undefined ? now + c.dueInDays * DAY : undefined,
          labelIds: c.labels
            ?.map((l) => labelIds[l])
            .filter((id): id is Id<'labels'> => Boolean(id)),
        })
        cardCount++
        if (c.checklist) {
          for (let ki = 0; ki < c.checklist.length; ki++) {
            await ctx.db.insert('checklistItems', {
              cardId,
              text: c.checklist[ki][0],
              checked: c.checklist[ki][1],
              position: ki,
            })
          }
        }
      }
    }

    return { skipped: false as const, boardId, workspaceId, cardCount }
  },
})
