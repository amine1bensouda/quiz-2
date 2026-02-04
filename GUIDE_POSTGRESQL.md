# 🐘 Guide de Configuration PostgreSQL

## 📍 Où Configurer PostgreSQL ?

Selon votre plateforme de déploiement, voici les options :

---

## Option 1 : Vercel (Recommandé - Le Plus Simple) ⭐

### Avantages
- ✅ Configuration automatique
- ✅ Base de données gérée
- ✅ Pas de configuration serveur nécessaire
- ✅ HTTPS inclus

### Étapes

1. **Créer un compte Vercel** : https://vercel.com

2. **Connecter votre projet GitHub/GitLab**

3. **Ajouter Vercel Postgres** :
   - Dans le dashboard Vercel, allez dans votre projet
   - Onglet **"Storage"** → **"Create Database"**
   - Choisissez **"Postgres"**
   - Vercel créera automatiquement la base de données

4. **Variables d'environnement** :
   - Vercel ajoute automatiquement `POSTGRES_PRISMA_URL` et `POSTGRES_URL_NON_POOLING`
   - Dans votre projet, allez dans **Settings** → **Environment Variables**
   - Ajoutez :
     ```
     DATABASE_URL=$POSTGRES_PRISMA_URL
     ```

5. **Déployer** :
   ```bash
   # Vercel détecte automatiquement Next.js
   vercel
   ```

### Coût
- **Gratuit** : 256 MB de stockage, 60 heures de calcul/mois
- **Pro** : $20/mois pour plus de ressources

---

## Option 2 : Supabase (Gratuit et Recommandé) 🆓

### Avantages
- ✅ **Gratuit** jusqu'à 500 MB
- ✅ Interface web intuitive
- ✅ API REST automatique
- ✅ Authentification intégrée (optionnel)

### Étapes

1. **Créer un compte** : https://supabase.com

2. **Créer un nouveau projet** :
   - Cliquez sur **"New Project"**
   - Choisissez un nom et un mot de passe
   - Sélectionnez une région proche de vous

3. **Récupérer la connection string** :
   - Dans votre projet Supabase, allez dans **Settings** → **Database**
   - Copiez la **"Connection string"** (URI)
   - Format : `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

4. **Configurer dans votre projet** :
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require"
   ```

5. **Migrer Prisma** :
   ```bash
   npx prisma migrate deploy
   ```

### Coût
- **Gratuit** : 500 MB de stockage, 2 GB de bande passante/mois

---

## Option 3 : Railway (Simple et Rapide) 🚂

### Avantages
- ✅ Configuration en quelques clics
- ✅ Interface simple
- ✅ Déploiement automatique

### Étapes

1. **Créer un compte** : https://railway.app

2. **Créer un nouveau projet** :
   - Cliquez sur **"New Project"**
   - Choisissez **"Provision PostgreSQL"**

3. **Récupérer les variables** :
   - Railway génère automatiquement `DATABASE_URL`
   - Cliquez sur la base de données → **"Variables"**
   - Copiez `DATABASE_URL`

4. **Connecter à votre projet Next.js** :
   - Dans Railway, créez un nouveau service
   - Connectez votre repo GitHub
   - Ajoutez la variable `DATABASE_URL` dans les variables d'environnement

### Coût
- **Gratuit** : $5 de crédit/mois (suffisant pour commencer)

---

## Option 4 : Render (Gratuit avec Limitations) 🎨

### Avantages
- ✅ Plan gratuit disponible
- ✅ Configuration simple

### Étapes

1. **Créer un compte** : https://render.com

2. **Créer une base PostgreSQL** :
   - Dashboard → **"New +"** → **"PostgreSQL"**
   - Choisissez un nom et une région
   - Sélectionnez le plan **"Free"** (limité mais gratuit)

3. **Récupérer la connection string** :
   - Dans votre base de données, allez dans **"Connections"**
   - Copiez **"Internal Database URL"**

4. **Configurer** :
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

### Coût
- **Gratuit** : 90 jours, puis $7/mois minimum

---

## Option 5 : VPS (Serveur Dédié) 🖥️

### Avantages
- ✅ Contrôle total
- ✅ Pas de limitations
- ✅ Coût fixe

### Étapes

1. **Installer PostgreSQL** :
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # CentOS/RHEL
   sudo yum install postgresql-server postgresql-contrib
   ```

2. **Créer la base de données** :
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   CREATE DATABASE quiz_db;
   CREATE USER quiz_user WITH PASSWORD 'votre_mot_de_passe_securise';
   GRANT ALL PRIVILEGES ON DATABASE quiz_db TO quiz_user;
   \q
   ```

3. **Configurer la connexion** :
   ```env
   DATABASE_URL="postgresql://quiz_user:votre_mot_de_passe_securise@localhost:5432/quiz_db"
   ```

4. **Sécuriser PostgreSQL** :
   ```bash
   # Éditer pg_hba.conf
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   
   # Ajouter (pour connexions locales)
   local   all             all                                     md5
   host    all             all             127.0.0.1/32            md5
   ```

### Coût
- VPS : $5-20/mois selon le fournisseur (DigitalOcean, Linode, etc.)

---

## Option 6 : Docker (Développement Local) 🐳

### Pour tester en local avant de déployer

1. **Créer `docker-compose.yml`** :
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_USER: quiz_user
         POSTGRES_PASSWORD: quiz_password
         POSTGRES_DB: quiz_db
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Démarrer PostgreSQL** :
   ```bash
   docker-compose up -d
   ```

3. **Configurer `.env.local`** :
   ```env
   DATABASE_URL="postgresql://quiz_user:quiz_password@localhost:5432/quiz_db"
   ```

---

## 🔧 Configuration Après Création de la Base

### 1. Migrer le schéma Prisma

```bash
# Remplacer le schéma SQLite par PostgreSQL
mv prisma/schema.prisma prisma/schema.sqlite.prisma
mv prisma/schema.postgresql.prisma prisma/schema.prisma

# Générer le client Prisma
npx prisma generate

# Créer les tables
npx prisma migrate deploy
```

### 2. Vérifier la connexion

```bash
# Ouvrir Prisma Studio
npx prisma studio
```

### 3. Tester le build

```bash
npm run build
npm start
```

---

## 📊 Comparaison des Options

| Option | Coût | Difficulté | Recommandé pour |
|--------|------|------------|-----------------|
| **Vercel Postgres** | Gratuit (limité) | ⭐ Facile | Déploiement Vercel |
| **Supabase** | Gratuit (500 MB) | ⭐ Facile | **Débutants** ⭐ |
| **Railway** | $5 crédit/mois | ⭐ Facile | Déploiement rapide |
| **Render** | Gratuit (90j) | ⭐⭐ Moyen | Petits projets |
| **VPS** | $5-20/mois | ⭐⭐⭐ Difficile | Contrôle total |
| **Docker** | Gratuit | ⭐⭐ Moyen | Développement local |

---

## 🎯 Recommandation

Pour commencer rapidement, je recommande **Supabase** :
- ✅ Gratuit
- ✅ Facile à configurer
- ✅ Interface web intuitive
- ✅ Documentation excellente

Ensuite, vous pouvez migrer vers Vercel Postgres si vous déployez sur Vercel.

---

## ⚠️ Sécurité

Quelle que soit l'option choisie :

1. ✅ Utilisez des mots de passe forts
2. ✅ Activez SSL/TLS (`?sslmode=require`)
3. ✅ Ne commitez jamais les credentials dans Git
4. ✅ Utilisez des variables d'environnement
5. ✅ Limitez l'accès réseau si possible

---

## 📝 Exemple de Configuration Complète

### `.env.local` (Production)

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Application
NEXT_PUBLIC_SITE_URL=https://theschoolofmathematics.com
NODE_ENV=production

# WordPress (si utilisé)
WORDPRESS_API_URL=https://admin.votresite.com

# Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🆘 Besoin d'Aide ?

Si vous avez des questions sur une option spécifique, dites-moi laquelle vous préférez et je vous guiderai étape par étape !
