# Instructions pour pousser vers GitHub et déployer sur Vercel

## 📤 Étape 1 : Push vers GitHub

### Vérifier l'état actuel

```bash
git status
```

### Voir les commits à pousser

```bash
git log origin/main..HEAD
```

### Pousser vers GitHub

```bash
# Pousser la branche main
git push origin main

# Ou si c'est la première fois
git push -u origin main
```

## 🚀 Étape 2 : Déployer sur Vercel

### Option A : Via l'interface Vercel (recommandé)

1. **Connecter le repository**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Add New Project"
   - Sélectionnez votre repository GitHub
   - Autorisez Vercel à accéder au repository

2. **Configuration automatique**
   - Vercel détectera automatiquement Next.js
   - Framework Preset : Next.js
   - Root Directory : `./`
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)

3. **Variables d'environnement**
   - Dans "Environment Variables", ajoutez :
     ```
     DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
     NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
     ADMIN_EMAIL=admin@example.com
     ADMIN_PASSWORD=your-hashed-password
     ```
   - Voir `DEPLOYMENT.md` pour plus de détails

4. **Déploiement**
   - Cliquez sur "Deploy"
   - Vercel déploiera automatiquement votre projet

### Option B : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Pour la production
vercel --prod
```

## ✅ Vérifications post-déploiement

1. **Vérifier le build**
   - Consultez les logs de build dans Vercel
   - Vérifiez qu'il n'y a pas d'erreurs

2. **Tester le site**
   - Visitez l'URL fournie par Vercel
   - Testez les fonctionnalités principales :
     - Page d'accueil : `/`
     - Liste des quiz : `/quiz`
     - Panel admin : `/admin/login`

3. **Vérifier la base de données**
   - Assurez-vous que les migrations Prisma sont exécutées
   - Vérifiez que les données sont accessibles

## 🔄 Déploiements futurs

Une fois configuré, chaque push sur `main` déclenchera automatiquement un nouveau déploiement sur Vercel.

Pour déployer manuellement :
- Via l'interface Vercel : Dashboard → Project → Deployments → Redeploy
- Via CLI : `vercel --prod`

## 📚 Documentation complète

Consultez `DEPLOYMENT.md` pour un guide détaillé de déploiement.
