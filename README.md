# Flowboard

**Plateforme de gestion de projet collaborative** — boards style Kanban, objectifs, docs, sprints, automatisations. Construit avec une stack moderne fullstack temps réel.

> Production : [`https://trello.projetsynergie.fr`](https://trello.projetsynergie.fr) — déployée sur un VPS Hetzner avec Convex self-hosted derrière Caddy.

Le projet a démarré comme un clone pixel-perfect de Trello (police Atlassian Sans, design tokens `--ds-*`), puis a évolué en un produit autonome **Flowboard** avec un design system propre inspiré de Linear/Notion, et un ensemble de pages outils (My Work, Objectifs, Docs, Sprints, Workload, Templates, Automatisations).

---

## Stack technique

| Couche | Techno |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (SSR React) + [TanStack Router](https://tanstack.com/router) (file-based) |
| UI | React 19 · TypeScript · Tailwind CSS v4 · [shadcn/ui](https://ui.shadcn.com) · [Radix UI](https://www.radix-ui.com/) |
| Backend | [Convex](https://convex.dev) (self-hosted via Docker) — base de données temps réel + fonctions serveur |
| Auth | [Better-Auth](https://better-auth.com) via [`@convex-dev/better-auth`](https://github.com/get-convex/better-auth) |
| Drag & Drop | [@dnd-kit](https://dndkit.com/) |
| Build / Bundler | [Vite 8](https://vitejs.dev/) |
| Qualité | [Biome](https://biomejs.dev/) · [Vitest](https://vitest.dev) · [Testing Library](https://testing-library.com) |
| Déploiement | Docker Compose · [Caddy](https://caddyserver.com/) · VPS Hetzner |

---

## Fonctionnalités

### Boards (cœur historique du produit)
- **Workspaces** → **Boards** → **Listes** → **Cartes** (hiérarchie complète)
- Drag & drop fluide pour les cartes et les listes
- Multi-utilisateur : invitations par email, membres workspace + board, rôles `owner`/`member`
- **Cartes complètes** : titre, description, checklist, étiquettes (8 couleurs), date d'échéance, couverture (couleur ou image Unsplash), pièces jointes (Convex storage), commentaires + mentions `@user`, membres assignés, journal d'activité, archive
- **Vues board** : Kanban (défaut), Tableau, Calendrier, Timeline, Dashboard
- Export **JSON** et **CSV** d'un board entier
- Notifications in-app temps réel avec cloche + badge

### Pages outils (productivité)
- **`/my-work`** — Inbox, Mon jour, Mes tâches, Vues sauvegardées (cartes assignées à l'utilisateur, agrégées depuis tous les boards accessibles)
- **`/goals`** — Objectifs trimestriels (OKR) avec key results et progression
- **`/docs`** — Wiki personnel/équipe avec titre, emoji et contenu
- **`/sprints`** — Sprints agiles avec dates, points engagés/terminés et statut
- **`/workload`** — Charge de travail agrégée par membre (cartes ouvertes, en retard, dues cette semaine, terminées)
- **`/templates`** — Modèles de boards (produit, ingé, design, marketing, ops) qui créent un vrai board à l'usage
- **`/automations`** — Règles d'automatisation (CRUD activable par utilisateur)
- **`/settings`** — Paramètres du compte (profil, sécurité, suppression de compte)

### Recherche & navigation
- **Recherche globale live** (`GlobalSearch`) dans le header, branchée sur `convex/search.ts`
- **Palette de commandes ⌘K** (Cmd/Ctrl+K) — navigation et actions
- **Raccourcis style Linear** : `g`+`b` (boards), `g`+`i` (inbox), `g`+`t` (mes tâches), `g`+`o` (objectifs), `g`+`d` (docs), `g`+`s` (sprints), `g`+`,` (réglages)
- **`?`** — panneau d'aide des raccourcis

### Pages publiques (marketing)
- `/` (landing), `/pricing`, `/integrations`, `/changelog`, `/roadmap`
- `/login`, `/register`

### Design system « gestion-pro »
- Police **[Geist](https://vercel.com/font)**
- Accent **indigo** (`oklch(0.52 0.19 275)`)
- Surfaces warm-gray, ombres douces, bordures `--border-c`
- Header pleine largeur avec marque alignée sur la sidebar, sidebar 260 px
- Tokens centralisés dans `src/styles.css`

---

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

Suivre la [doc officielle Convex self-hosted](https://github.com/get-convex/convex-backend/tree/main/self-hosted) pour lancer le backend Convex en local (port 3210 par défaut).

### Variables d'environnement (`.env.local`)

```env
# Convex self-hosted
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<ton-admin-key>
VITE_CONVEX_URL=http://127.0.0.1:3210
VITE_CONVEX_SITE_URL=http://127.0.0.1:3211

# Better-Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<un-secret-32-chars-minimum>

# URL de site
VITE_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

> ⚠️ **Ne jamais commit `.env*`.** Le `.gitignore` les exclut déjà — vérifie toujours `git status` avant un commit.

### Démarrer

```bash
npx convex dev   # push schema + fonctions vers Convex (à laisser tourner)
npm run dev      # serveur Vite sur localhost:3000
```

### Scripts utiles

| Script | Effet |
| --- | --- |
| `npm run dev` | Serveur dev SSR (Vite) sur `127.0.0.1:3000` |
| `npm run build` | Build production |
| `npm run preview` | Preview du build |
| `npm test` | Lance Vitest |
| `npm run check` | Lint + format check (Biome) |
| `npm run lint` | Lint seul |
| `npm run format` | Formatage automatique |

---

## Architecture

```
src/
├── features/
│   ├── app/                  # Shell partagé (design gestion-pro)
│   │   ├── AppShell.tsx      # Layout global = header + (sidebar + main)
│   │   ├── AppTopbar.tsx     # Header pleine largeur, marque + search + avatar
│   │   ├── AppSidebar.tsx    # Navigation latérale (260 px)
│   │   ├── CommandPalette.tsx# ⌘K
│   │   ├── ShortcutsHelp.tsx # Panneau ?
│   │   ├── MarketingShell.tsx# Layout des pages publiques
│   │   ├── AuthLayout.tsx    # Layout login / register
│   │   ├── primitives.tsx    # Boutons, badges, etc. réutilisables
│   │   └── Icon.tsx          # Pictos inline
│   ├── board/                # UI d'un board (Kanban, listes, cartes, modal)
│   │   ├── BoardMenu.tsx     # Menu latéral d'un board (export JSON/CSV)
│   │   ├── card/             # CardItem, CardDetailModal, QuickEditPanel
│   │   ├── list/             # ListColumn (drag), AddListColumn
│   │   ├── views/            # TableView, CalendarView
│   │   └── shared/           # MemberAvatar, NotificationBell
│   ├── workspace/            # WorkspaceView (header + grille des boards)
│   └── shared/
│       ├── FlowboardLogo.tsx # Logo officiel Flowboard
│       └── GlobalSearch.tsx  # Recherche live globale
├── lib/                      # helpers, constants, hooks
└── routes/                   # TanStack Router file-based
    ├── __root.tsx
    ├── index.tsx             # Landing
    ├── login.tsx / register.tsx
    ├── boards/               # Liste + détail d'un board
    ├── my-work.tsx           # Inbox + tâches assignées
    ├── goals.tsx             # OKR
    ├── docs.tsx              # Wiki
    ├── sprints.tsx           # Sprints
    ├── workload.tsx          # Charge par membre
    ├── templates.tsx         # Modèles de boards
    ├── automations.tsx       # Règles d'automatisation
    ├── settings.tsx          # Réglages compte
    └── pricing / integrations / changelog / roadmap

convex/
├── schema.ts                 # 16 tables (voir détail ci-dessous)
├── auth.ts / auth.config.ts  # Better-Auth + Convex
├── boards.ts / workspaces.ts / lists.ts / cards.ts / labels.ts
├── boardMembers.ts / workspaceMembers.ts
├── attachments.ts / comments.ts / checklistItems.ts / activity.ts
├── notifications.ts
├── goals.ts / docs.ts / sprints.ts / savedViews.ts / automations.ts
├── myWork.ts                 # Agrégation des cartes assignées
├── workload.ts               # Agrégation par membre
├── templates.ts              # createFromTemplate (crée un vrai board)
├── search.ts                 # Recherche globale
├── seed.ts                   # Données de démo (dev)
├── migrations.ts             # Migrations de schéma
└── lib_*.ts                  # Helpers (auth, board access, workspace access, my_boards, activity)
```

### Schéma Convex (16 tables)

**Collaboration de base**
- `workspaces` · `workspaceMembers` · `workspaceInvitations`
- `boards` · `boardMembers` · `boardInvitations`
- `lists` · `cards` · `labels` · `checklistItems` · `comments` · `attachments`
- `activity` · `notifications`

**Pages outils (owner-scopées, index `by_owner`)**
- `goals` + `keyResults` (OKR)
- `docs` (wiki)
- `sprints` (cycles agiles)
- `savedViews` (vues sauvegardées dans My Work)
- `automationRules` (règles d'automatisation)

> ℹ️ Les automatisations sont **stockables et activables**, mais **le moteur d'exécution n'est pas encore branché** sur les mutations cartes.

---

## Déploiement (production)

L'app tourne en production sur un VPS Hetzner derrière le reverse-proxy **Caddy CHADIA** partagé (TLS automatique).

### Composants

- `Dockerfile` — image de l'app Node 20 alpine
- `docker-compose.production.yml` — service `app` (server SSR) connecté au Convex distant
- `docker-compose.convex.production.yml` — backend Convex self-hosted
- `server-prod.mjs` — serveur Hono qui sert les routes SSR + fichiers statiques

### Variables d'environnement (`.env.production`)

```env
TRELLO_DOMAIN=projetsynergie.fr
CONVEX_SELF_HOSTED_URL=...
CONVEX_SELF_HOSTED_ADMIN_KEY=...
VITE_CONVEX_URL=https://convex.projetsynergie.fr
VITE_CONVEX_SITE_URL=https://convex.projetsynergie.fr
BETTER_AUTH_URL=https://trello.projetsynergie.fr
BETTER_AUTH_SECRET=...
SITE_URL=https://trello.projetsynergie.fr
```

### Build & rebuild

```bash
# Rebuild + redémarrage du conteneur app
DOCKER_HOST=unix:///var/run/docker.sock \
  docker compose --env-file .env.production \
  -f docker-compose.production.yml up -d --build

# Déploiement des fonctions Convex
npx convex deploy -y
```

> 📌 Sur Hetzner, `DOCKER_HOST` par défaut pointe vers un socket rootless inexistant — toujours overrider avec `unix:///var/run/docker.sock`.

---

## Tests

Quelques tests unitaires Vitest dans `src/__tests__/`. Lance-les avec `npm test`.

L'essentiel de la vérification se fait **end-to-end via le navigateur** (le projet utilise un MCP `chrome-devtools` en dev pour tester les flux : register, créer board, drag & drop, mention, notification, etc.).

---

## Licence

MIT — projet personnel à vocation pédagogique. Le nom **Flowboard** est utilisé en interne ; aucune marque tierce n'est revendiquée.
