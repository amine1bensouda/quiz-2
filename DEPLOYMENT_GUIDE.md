# 🚀 Guide de Déploiement

Ce guide explique comment déployer l'application Quiz avec son backend indépendant.

## 📋 Prérequis

- Compte sur une plateforme de déploiement (Vercel, Netlify, Railway, etc.)
- Base de données PostgreSQL (ou SQLite pour développement)
- Variables d'environnement configurées

## 🔧 Configuration pour le Déploiement

### 1. Variables d'Environnement

Créez un fichier `.env.production` ou configurez les variables dans votre plateforme :

```env
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/dbname"
# ou pour SQLite (développement uniquement)
# DATABASE_URL="file:./prisma/prod.db"

# WordPress (optionnel, pour fallback)
WORDPRESS_API_URL="https://votre-site-wordpress.com"

# Admin
ADMIN_PASSWORD="votre-mot-de-passe-securise"

# Next.js
NEXT_PUBLIC_SITE_URL="https://votre-site.com"
NODE_ENV="production"
```

### 2. Base de Données

#### Option A : PostgreSQL (Recommandé pour production)

1. Créez une base de données PostgreSQL (Railway, Supabase, Neon, etc.)
2. Mettez à jour `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Générez et appliquez les migrations :
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

#### Option B : SQLite (Développement uniquement)

⚠️ SQLite n'est pas recommandé pour la production car il ne supporte pas les connexions concurrentes.

### 3. Migration des Données

Si vous avez des données à migrer :

```bash
# Exécutez le script de migration
npx tsx scripts/migrate-wordpress-to-prisma.ts
```

## 🌐 Déploiement sur Vercel

### Étape 1 : Préparer le Projet

1. Assurez-vous que `package.json` contient le script de build :
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build",
       "postinstall": "prisma generate"
     }
   }
   ```

2. Créez un fichier `vercel.json` (optionnel) :
   ```json
   {
     "buildCommand": "prisma generate && next build",
     "installCommand": "npm install && prisma generate"
   }
   ```

### Étape 2 : Déployer sur Vercel

1. Connectez votre repository GitHub/GitLab à Vercel
2. Configurez les variables d'environnement dans Vercel Dashboard
3. Déployez !

### Étape 3 : Post-Déploiement

1. Exécutez les migrations :
   ```bash
   npx prisma migrate deploy
   ```

2. Vérifiez que l'application fonctionne

## 🌐 Déploiement sur Netlify

### Étape 1 : Configuration

Créez `netlify.toml` :

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Étape 2 : Variables d'Environnement

Configurez dans Netlify Dashboard → Site settings → Environment variables

### Étape 3 : Déployer

1. Connectez votre repository
2. Configurez les variables d'environnement
3. Déployez !

## 🐳 Déploiement avec Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔒 Sécurité

### Recommandations

1. **Mot de passe admin** : Utilisez un mot de passe fort et unique
2. **HTTPS** : Activez HTTPS sur votre domaine
3. **Variables d'environnement** : Ne commitez jamais `.env` ou `.env.local`
4. **Base de données** : Utilisez des credentials sécurisés
5. **CORS** : Configurez CORS si nécessaire

### Exemple `.env.production`

```env
# Ne jamais commiter ce fichier !
ADMIN_PASSWORD="votre-mot-de-passe-tres-securise-avec-123-symboles-!@#"
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

## 📊 Vérification Post-Déploiement

1. ✅ Accédez à `https://votre-site.com` - Le site doit fonctionner
2. ✅ Accédez à `https://votre-site.com/admin/login` - L'admin doit fonctionner
3. ✅ Testez la création d'un quiz
4. ✅ Vérifiez que les quiz s'affichent sur le site public

## 🐛 Dépannage

### Erreur "Prisma Client not generated"

```bash
npx prisma generate
```

### Erreur de connexion à la base de données

- Vérifiez que `DATABASE_URL` est correct
- Vérifiez que la base de données est accessible depuis votre serveur
- Pour PostgreSQL, vérifiez les paramètres SSL si nécessaire

### Erreur "Module not found"

```bash
npm install
npx prisma generate
```

## 📝 Notes Importantes

- **SQLite** : Ne pas utiliser en production (limitations de concurrence)
- **Migrations** : Exécutez `prisma migrate deploy` après chaque déploiement
- **Build** : Assurez-vous que `prisma generate` est exécuté avant `next build`

## 🎉 C'est tout !

Votre application est maintenant déployée et prête à être utilisée !
