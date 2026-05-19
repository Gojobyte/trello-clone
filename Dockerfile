# syntax=docker/dockerfile:1.7

# =========================================================================
# Stage 1 : Build
# =========================================================================
FROM node:20-alpine AS builder

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
FROM node:20-alpine AS runner

WORKDIR /app

# Crée un user non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs trello

# Copie uniquement le build output (~10-30 Mo, beaucoup plus léger que node_modules)
COPY --from=builder --chown=trello:nodejs /app/.output ./.output

USER trello

EXPOSE 3000

# Variables runtime (côté serveur Node, lues à l'exécution)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# TanStack Start produit un serveur Nitro autonome
CMD ["node", ".output/server/index.mjs"]
