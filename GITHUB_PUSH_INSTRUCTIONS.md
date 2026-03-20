# Instructions pour pousser vers GitHub et déployer sur Vercel

## Dépôt GitHub du projet

**URL du dépôt :** [https://github.com/amine1bensouda/quiz-2](https://github.com/amine1bensouda/quiz-2)

### Prérequis sur Windows

1. Installez [Git for Windows](https://git-scm.com/download/win) **ou** utilisez [GitHub Desktop](https://desktop.github.com/).
2. Ouvrez **Git Bash** ou **PowerShell** dans le dossier du projet :  
   `c:\xampp\htdocs\quiz-2-main`

### Première fois : initialiser Git et lier GitHub

Si le dossier n’est **pas** encore un dépôt Git :

```bash
cd c:\xampp\htdocs\quiz-2-main
git init
git branch -M main
git remote add origin https://github.com/amine1bensouda/quiz-2.git
```

Si `origin` existe déjà mais pointe ailleurs :

```bash
git remote set-url origin https://github.com/amine1bensouda/quiz-2.git
```

> **Sécurité :** `.env` est déjà dans `.gitignore` — ne le commitez **jamais** (mots de passe Supabase, etc.).

### Enregistrer et pousser

```bash
git add .
git status
git commit -m "Mise à jour projet (pool Prisma, stats, Supabase)"
git push -u origin main
```

Si GitHub refuse et demande une auth : utilisez un **Personal Access Token** (GitHub → Settings → Developer settings → Tokens) à la place du mot de passe, ou connectez-vous avec **SSH** (`git@github.com:amine1bensouda/quiz-2.git`).

Si le dépôt distant a déjà des commits (ex. README) et que `git push` échoue :

```bash
git pull origin main --rebase
git push -u origin main
```

---

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
