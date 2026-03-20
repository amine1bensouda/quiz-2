# ✅ Checklist de Déploiement

## ⚠️ PROBLÈMES CRITIQUES À CORRIGER

### 1. ❌ Configuration Next.js incompatible avec API Routes

**Problème** : `next.config.js` active `output: 'export'` en production, ce qui **désactive les API Routes**.

**Impact** : 
- ❌ L'authentification ne fonctionnera pas (`/api/auth/*`)
- ❌ L'admin ne fonctionnera pas (`/api/admin/*`)
- ❌ Les quiz attempts ne seront pas sauvegardés (`/api/quiz-attempts`)
- ❌ Les routes utilisateur ne fonctionneront pas (`/api/users/*`)

**Solution** : 
```javascript
// next.config.js - RETIRER cette ligne :
...(isProd ? { output: 'export' } : {}),
```

**Remplacement** :
```javascript
// Pour un déploiement avec API Routes (Vercel, Node.js server, etc.)
const nextConfig = {
  reactStrictMode: true,
  // Ne PAS utiliser output: 'export' si vous avez des API Routes
  // ... reste de la config
}
```

### 2. ⚠️ Base de données SQLite en développement

**Problème** : Le schéma Prisma utilise SQLite (`provider = "sqlite"`).

**Impact** : SQLite n'est pas adapté pour la production (concurrence limitée, pas de réseau).

**Solution** : Migrer vers PostgreSQL pour la production.

**Actions** :
1. Créer une base PostgreSQL sur votre hébergeur
2. Modifier `prisma/schema.prisma` :
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
3. Créer une migration : `npx prisma migrate deploy`
4. Configurer `DATABASE_URL` dans les variables d'environnement

## ✅ Points Positifs

### 1. ✅ Code sans erreurs
- Aucune erreur de lint détectée
- TypeScript correctement configuré
- Toutes les fonctions async/await corrigées

### 2. ✅ Authentification prête
- Système d'authentification complet avec Prisma
- Routes API pour register/login/logout
- Gestion des sessions avec cookies httpOnly
- Hashage des mots de passe avec bcrypt

### 3. ✅ Structure du projet
- Architecture claire et organisée
- Composants réutilisables
- Services séparés (auth, quiz, course)

### 4. ✅ Scripts de build
- `npm run build` : Génère Prisma client + build Next.js
- `postinstall` : Génère automatiquement Prisma client

## 📋 Checklist Complète

### Configuration
- [ ] **Corriger `next.config.js`** (retirer `output: 'export'`)
- [ ] **Configurer PostgreSQL** dans Prisma schema
- [ ] **Variables d'environnement** configurées :
  - [ ] `DATABASE_URL` (PostgreSQL)
  - [ ] `NEXT_PUBLIC_SITE_URL`
  - [ ] `WORDPRESS_API_URL` (si utilisé)
  - [ ] `NEXT_PUBLIC_GA_ID` (optionnel)
  - [ ] `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (optionnel)

### Base de données
- [ ] Créer la base PostgreSQL
- [ ] Exécuter `npx prisma migrate deploy`
- [ ] Vérifier que les tables sont créées
- [ ] Migrer les données existantes (si nécessaire)

### Build et Tests
- [ ] `npm run build` réussit sans erreur
- [ ] `npm start` démarre correctement
- [ ] Tester l'authentification (register/login/logout)
- [ ] Tester l'admin (création de cours/modules/quiz)
- [ ] Tester les quiz (affichage, soumission, sauvegarde)

### Sécurité
- [ ] Variables d'environnement sécurisées (pas dans Git)
- [ ] `.env.local` dans `.gitignore` ✅ (vérifié)
- [ ] Mots de passe admin forts
- [ ] HTTPS activé (si possible)

### Performance
- [ ] Images optimisées
- [ ] Cache configuré correctement
- [ ] Revalidation ISR configurée

## 🚀 Options de Déploiement

### Option 1 : Vercel (Recommandé)
✅ Support natif des API Routes
✅ PostgreSQL via Vercel Postgres ou externe
✅ Déploiement automatique depuis Git
✅ HTTPS inclus

**Actions** :
1. Connecter le repo GitHub/GitLab
2. Configurer les variables d'environnement
3. Déployer

### Option 2 : Node.js Server (VPS)
✅ Contrôle total
✅ API Routes fonctionnent
⚠️ Nécessite configuration serveur

**Actions** :
1. Installer Node.js 18+ sur le serveur
2. Cloner le repo
3. Configurer PostgreSQL
4. Configurer PM2 ou systemd
5. Configurer Nginx comme reverse proxy

### Option 3 : Docker
✅ Environnement isolé
✅ Facile à déployer
✅ API Routes fonctionnent

**Actions** :
1. Créer Dockerfile
2. Créer docker-compose.yml
3. Déployer avec Docker

## ⚠️ IMPORTANT : Ne PAS utiliser `output: 'export'`

Si vous utilisez `output: 'export'`, vous ne pouvez PAS utiliser :
- ❌ API Routes (`/api/*`)
- ❌ Server Components avec données dynamiques
- ❌ Authentification côté serveur
- ❌ Routes dynamiques avec `generateStaticParams`

## 📝 Prochaines Étapes

1. **URGENT** : Corriger `next.config.js`
2. Configurer PostgreSQL
3. Tester le build en local
4. Choisir une plateforme de déploiement
5. Configurer les variables d'environnement
6. Déployer et tester

## 🔗 Ressources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vercel Deployment](https://vercel.com/docs)
