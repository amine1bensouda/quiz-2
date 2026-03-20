# Guide de déploiement sur Vercel

## 📋 Prérequis

- Compte GitHub avec le repository du projet
- Compte Vercel (gratuit disponible)
- Base de données PostgreSQL (Vercel Postgres, Supabase, ou autre)

## 🚀 Étapes de déploiement

### 1. Préparer le code pour GitHub

```bash
# Vérifier l'état des fichiers
git status

# Ajouter tous les fichiers modifiés
git add .

# Créer un commit
git commit -m "feat: ajout des fonctionnalités de quiz avec Prisma, LaTeX, et admin panel"

# Pousser vers GitHub
git push origin main
```

### 2. Configurer Vercel

1. **Connecter GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Add New Project"
   - Sélectionnez votre repository GitHub
   - Autorisez Vercel à accéder au repository

2. **Configuration du projet**
   - Framework Preset : Next.js (détecté automatiquement)
   - Root Directory : `./` (racine)
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)
   - Install Command : `npm install` (par défaut)

### 3. Variables d'environnement sur Vercel

Dans les paramètres du projet Vercel, ajoutez ces variables :

#### Variables requises

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-hashed-password
```

#### Variables optionnelles

```
WORDPRESS_API_URL=https://admin.votresite.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
NEXT_REVALIDATE_TIME=3600
NODE_ENV=production
```

**Note** : Pour `ADMIN_PASSWORD`, vous devez utiliser un hash bcrypt. Vous pouvez générer un hash avec :

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(hash => console.log(hash));"
```

### 4. Base de données PostgreSQL

#### Option 1 : Vercel Postgres (recommandé)

1. Dans votre projet Vercel, allez dans l'onglet "Storage"
2. Cliquez sur "Create Database" → "Postgres"
3. Créez la base de données
4. Copiez la variable `POSTGRES_URL` et ajoutez-la comme `DATABASE_URL` dans les variables d'environnement

#### Option 2 : Supabase (gratuit)

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans Settings → Database
4. Copiez la "Connection string" (URI)
5. Ajoutez-la comme `DATABASE_URL` dans Vercel

#### Option 3 : Autre fournisseur PostgreSQL

Utilisez n'importe quel fournisseur PostgreSQL (Railway, Neon, etc.) et ajoutez l'URL de connexion comme `DATABASE_URL`.

### 5. Migrer la base de données

Une fois la base de données configurée, vous devez exécuter les migrations Prisma :

```bash
# En local, avec la DATABASE_URL de production
npx prisma migrate deploy
```

Ou via Vercel CLI :

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Exécuter les migrations
vercel env pull .env.local
npx prisma migrate deploy
```

### 6. Déploiement

1. Vercel déploiera automatiquement à chaque push sur `main`
2. Vous pouvez aussi déclencher un déploiement manuel depuis le dashboard Vercel
3. Le build inclura automatiquement `prisma generate` grâce au script `postinstall`

### 7. Vérification post-déploiement

1. Vérifiez que le site fonctionne : `https://your-project.vercel.app`
2. Testez l'admin panel : `https://your-project.vercel.app/admin/login`
3. Vérifiez les quiz : `https://your-project.vercel.app/quiz`

## 🔧 Configuration avancée

### Domaine personnalisé

1. Dans Vercel, allez dans Settings → Domains
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

### Variables d'environnement par environnement

Vous pouvez définir des variables différentes pour :
- Production
- Preview (branches)
- Development

Dans Settings → Environment Variables de Vercel.

## 🐛 Dépannage

### Erreur de build Prisma

Si vous avez des erreurs liées à Prisma lors du build :

1. Vérifiez que `DATABASE_URL` est correctement configurée
2. Vérifiez que `postinstall` est dans `package.json` : `"postinstall": "prisma generate"`
3. Vérifiez que le schéma Prisma est valide : `npx prisma validate`

### Erreur de connexion à la base de données

1. Vérifiez que `DATABASE_URL` est correcte
2. Vérifiez que la base de données accepte les connexions depuis Vercel (whitelist IP)
3. Pour Vercel Postgres, cela devrait fonctionner automatiquement

### Erreur de build Next.js

1. Vérifiez les logs de build dans Vercel
2. Testez le build localement : `npm run build`
3. Vérifiez que toutes les dépendances sont dans `package.json`

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Next.js](https://nextjs.org/docs)
