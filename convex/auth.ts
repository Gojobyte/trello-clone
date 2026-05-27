import { betterAuth } from 'better-auth/minimal'
import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import authConfig from './auth.config'
import { components } from './_generated/api'
import { query } from './_generated/server'
import type { DataModel } from './_generated/dataModel'

const siteUrl = process.env.SITE_URL!

// Origines autorisées (dev + prod). Ajouter ici tout nouveau domaine.
const trustedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://trello.projetsynergie.fr',
  'https://projetsynergie.fr',
]

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    // Permet la suppression de compte depuis la page Paramètres.
    // Le mot de passe est exigé côté client pour confirmer l'identité.
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    // Cookie utilisable sur tous les sous-domaines (trello.X.fr,
    // auth.X.fr, api.X.fr) pour que la session se propage en prod.
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: process.env.COOKIE_DOMAIN || undefined,
      },
    },
    plugins: [convex({ authConfig })],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx)
  },
})
