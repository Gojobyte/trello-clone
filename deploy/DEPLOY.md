# Guide de déploiement — Trello clone

Stack cible : Hetzner VPS avec Docker + Caddy (reverse proxy + HTTPS Let's Encrypt).

## Prérequis

1. **Convex self-hosted** déjà en place (containers `trello-convex-backend` + `trello-convex-dashboard` healthy)
2. **Caddy** existant qui écoute sur ports 80/443 (réseau Docker `chadia-projects_default`)
3. **Domaine** acheté (ex: `gojobyte.xyz` chez Porkbun, ~1€/an la 1ère année)

## Étape 1 — Configurer les DNS

Dans le panneau du registrar (Porkbun, OVH, etc.), créer 3 records :

| Type | Host    | Answer            | TTL |
|------|---------|-------------------|-----|
| A    | `trello`| `188.245.42.63`   | 600 |
| A    | `api`   | `188.245.42.63`   | 600 |
| A    | `auth`  | `188.245.42.63`   | 600 |

Vérifier la propagation :
```bash
dig trello.gojobyte.xyz +short    # doit retourner 188.245.42.63
dig api.gojobyte.xyz +short
dig auth.gojobyte.xyz +short
```

## Étape 2 — Préparer le fichier .env.production

Sur le serveur Hetzner, dans `/home/hermes/trello-clone/` :

```bash
cat > .env.production << 'EOF'
TRELLO_DOMAIN=gojobyte.xyz
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
EOF
```

Le `BETTER_AUTH_SECRET` est généré aléatoirement. **Ne JAMAIS le committer.**

## Étape 3 — Mettre à jour la config Convex (SITE_URL)

Convex doit savoir quelle URL publique utiliser pour les callbacks auth.

```bash
# Dans le compose Convex existant, mettre :
# SITE_URL=https://trello.gojobyte.xyz
# Puis redémarrer le container Convex
```

## Étape 4 — Builder & lancer le frontend

```bash
cd /home/hermes/trello-clone

# Charger les variables .env.production dans le shell pour le build
set -a; source .env.production; set +a

# Build + lance le container frontend
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build

# Vérifie qu'il tourne et qu'il est sain
docker ps --filter name=trello-frontend
docker logs -f trello-frontend     # Ctrl+C pour quitter
```

## Étape 5 — Activer Caddy pour les nouveaux sous-domaines

### Option A — Modifier le Caddyfile principal (le plus simple)

```bash
# Dans /home/hermes/chadia-projects/Caddyfile, à la fin du fichier :
cat /home/hermes/trello-clone/deploy/Caddyfile.trello \
  | sed "s/{DOMAIN}/gojobyte.xyz/g" \
  >> /home/hermes/chadia-projects/Caddyfile

# Recharger Caddy (sans downtime)
docker exec chadia-projects-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

### Option B — Fichier séparé importé (plus propre)

```bash
# Préparer le Caddyfile spécifique
sed "s/{DOMAIN}/gojobyte.xyz/g" /home/hermes/trello-clone/deploy/Caddyfile.trello \
  > /home/hermes/chadia-projects/Caddyfile.trello

# Ajouter l'import au Caddyfile principal (à faire UNE seule fois)
echo "import /etc/caddy/Caddyfile.trello" >> /home/hermes/chadia-projects/Caddyfile

# Monter le fichier dans le container Caddy (modifier docker-compose CHADIA)
# Puis docker compose up -d
```

## Étape 6 — Pousser le schema Convex avec la nouvelle URL

```bash
cd /home/hermes/trello-clone

# Reconfigure Convex avec l'URL publique
export CONVEX_SELF_HOSTED_URL=https://api.gojobyte.xyz
export CONVEX_SELF_HOSTED_ADMIN_KEY=<admin-key>

npx convex deploy   # push fonctions + schema en mode prod
```

## Étape 7 — Tester

Ouvrir `https://trello.gojobyte.xyz` dans un navigateur :
- ✅ HTTPS valide (cadenas vert)
- ✅ Login / register marche (auth via `auth.gojobyte.xyz`)
- ✅ Queries Convex en temps réel (via `api.gojobyte.xyz` WebSocket)

## Maintenance

### Re-déployer après un push GitHub

```bash
cd /home/hermes/trello-clone
git pull origin main
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

### Logs

```bash
docker logs -f trello-frontend                  # logs SSR
docker logs -f trello-convex-backend            # logs Convex
docker logs -f chadia-projects-caddy-1          # logs Caddy (HTTPS, requêtes)
```

### Renouvellement domaine

Note importante : `.xyz` est à 1€ la **première** année puis ~10€ ensuite. Programme un rappel dans 11 mois pour budget.

## Troubleshooting

### Le certificat HTTPS ne se génère pas

- Vérifier que port 80 est ouvert (Caddy a besoin du défi HTTP-01)
- Vérifier que DNS propagé : `dig trello.gojobyte.xyz +short`
- Logs Caddy : `docker logs chadia-projects-caddy-1 | grep trello`

### Login échoue avec erreur CORS

- Vérifier que `Access-Control-Allow-Origin` dans Caddyfile pointe vers `https://trello.gojobyte.xyz`
- Vérifier que `BETTER_AUTH_URL` côté serveur = `https://trello.gojobyte.xyz`
- Vérifier que `trustedOrigins` dans `convex/auth.ts` inclut le domaine prod

### Le frontend ne charge pas les queries Convex

- Vérifier `VITE_CONVEX_URL=https://api.gojobyte.xyz` au build time
- Si valeur en cache : `--no-cache` au build
- Vérifier que le container Convex est sur le même network Docker
