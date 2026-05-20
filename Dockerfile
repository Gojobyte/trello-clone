# syntax=docker/dockerfile:1.7

# =========================================================================
# Stage 1 : Build
# =========================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Installe les deps. Lock copié séparément pour profiter du cache Docker
# (npm ci ne tournera que si package.json ou package-lock.json changent).
COPY package.json package-lock.json* ./
RUN npm ci

# Copie le reste du source
COPY . .

# Variables nécessaires au build (Vite inline les VITE_* dans le bundle client).
# Surchargées au moment du `docker build --build-arg ...` ou via env du compose.
ARG VITE_CONVEX_URL
ARG VITE_CONVEX_SITE_URL
ARG VITE_SITE_URL
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CONVEX_SITE_URL=$VITE_CONVEX_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

# Build TanStack Start (output Nitro dans .output/)
RUN npm run build

# =========================================================================
# Stage 2 : Runtime (image minimale)
# =========================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Crée un user non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs trello

# Installe UNIQUEMENT les deps de prod (TanStack Start ne bundle pas
# react/react-dom etc. dans dist/, donc on en a besoin au runtime).
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copie le build (client + server). TanStack Start 1.168 produit `dist/`.
COPY --from=builder --chown=trello:nodejs /app/dist ./dist

# Copie le wrapper Node HTTP (Hono) qui sert les assets + SSR
COPY --chown=trello:nodejs server-prod.mjs ./server-prod.mjs

USER trello

EXPOSE 3000

# Variables runtime (côté serveur Node, lues à l'exécution)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Entry point : serveur Hono qui sert static + SSR handler
CMD ["node", "server-prod.mjs"]
