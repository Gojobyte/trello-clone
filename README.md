# Trello Clone

Clone pixel-perfect de [Trello](https://trello.com) construit avec une stack moderne. Projet d'apprentissage fullstack avec un focus sur la fidélité au design original (police Atlassian Sans, design tokens `--ds-*` extraits du CSS core officiel, logo SVG, etc.).

## Stack

- **Framework** : [TanStack Start](https://tanstack.com/start) (SSR React) + [TanStack Router](https://tanstack.com/router)
- **UI** : React 19 + TypeScript + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)
- **Backend** : [Convex](https://convex.dev) (self-hosted via Docker)
- **Auth** : [Better-Auth](https://better-auth.com) via [@convex-dev/better-auth](https://github.com/get-convex/better-auth)
- **DnD** : [@dnd-kit](https://dndkit.com/)
- **Lint/format** : [Biome](https://biomejs.dev/)
- **Build** : Vite 8

## Fonctionnalités

### Hiérarchie complète
- **Workspaces** (espaces de travail) avec membres et invitations
- **Boards** (tableaux) avec membres aussi
- **Listes** verticales drag & droppables
- **Cartes** drag & drop entre listes

### Cartes — complet
- Titre éditable inline, description, checklist avec progress
- Étiquettes colorées (8 couleurs Atlassian)
- Date d'échéance avec calendrier + état (à venir / aujourd'hui / en retard / terminée)
- Couverture (couleur ou photo Unsplash)
- Pièces jointes (Convex file storage)
- Commentaires avec mentions `@user`
- Membres assignés (avatars empilés)
- Activité tracée
- Archive / suppression

### Multi-utilisateur
- Invitations par email (workspace ou board)
- Bannière d'invitations entrantes
- Notifications in-app avec cloche + badge
- Mentions @user dans commentaires

### Vues
- **Kanban** (par défaut)
- **Tableau** (table triable)
- **Calendrier** (grille mensuelle)

### UI/UX
- Police officielle **Atlassian Sans** via CDN public
- Logo SVG Trello officiel
- 102+ design tokens `--ds-*` extraits du CSS core de Trello
- Scrollbars custom Atlassian
- Animations DnD optimistes
- État actif visuel (bleu) dans la sidebar
- Recherche & filtres
- Mode color-blind avec patterns

## Setup local

### Prérequis
- Node.js 20+
- Docker (pour Convex self-hosted)
- Git

### Installation

```bash
git clone https://github.com/Gojobyte/trello-clone.git
cd trello-clone
npm install
```

### Convex self-hosted

Suivre la [doc officielle Convex self-hosted](https://github.com/get-convex/convex-backend/tree/main/self-hosted).

Variables d'env (`.env.local`) :
```env
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<ton-admin-key>
VITE_CONVEX_URL=http://127.0.0.1:3210
VITE_CONVEX_SITE_URL=http://127.0.0.1:3211
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<un-secret-32-chars>
VITE_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

### Démarrer

```bash
npx convex dev   # push schema + fonctions vers Convex
npm run dev      # serveur Vite sur localhost:3000
```

## Architecture

```
src/
├── features/board/        # UI d'un board (Kanban, listes, cartes, modal)
│   ├── BoardMenu.tsx
│   ├── card/              # CardItem, CardDetailModal, QuickEditPanel
│   ├── list/              # ListColumn (drag), AddListColumn
│   ├── views/             # TableView, CalendarView
│   └── shared/            # MemberAvatar, NotificationBell
├── features/workspace/    # WorkspaceView (header + grille des boards)
├── lib/                   # helpers, constants, hooks
└── routes/                # TanStack Router file-based

convex/
├── schema.ts              # 10 tables
├── boards.ts / workspaces.ts / cards.ts / lists.ts / labels.ts
├── boardMembers.ts / workspaceMembers.ts / notifications.ts
└── lib_board_access.ts    # helper d'autorisation centralisé
```

## Licence

MIT — projet éducatif. Le logo Trello et la marque appartiennent à Atlassian.
