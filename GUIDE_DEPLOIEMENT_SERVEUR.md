# 📦 Guide de Déploiement - Dossier à Importer sur le Serveur

## ✅ Fichiers et Dossiers à INCLURE dans le déploiement

### 📁 Structure essentielle

```
quiz-main/
├── src/                    ✅ TOUT le dossier (code source)
├── public/                 ✅ TOUT le dossier (images, fichiers statiques)
├── prisma/                 ✅ TOUT le dossier (schéma Prisma)
│   └── schema.prisma       ✅ Important pour générer le client Prisma
├── package.json            ✅ Obligatoire (dépendances)
├── package-lock.json       ✅ Recommandé (versions exactes)
├── next.config.js          ✅ Configuration Next.js
├── tsconfig.json           ✅ Configuration TypeScript
├── tailwind.config.js      ✅ Configuration Tailwind CSS
├── postcss.config.js       ✅ Configuration PostCSS
└── .env                    ⚠️ À créer sur le serveur (voir ci-dessous)
```

### 📄 Fichiers de configuration spécifiques

- `next.config.js` ✅
- `tsconfig.json` ✅
- `tailwind.config.js` ✅
- `postcss.config.js` ✅
- `package.json` ✅
- `package-lock.json` ✅

## ❌ Fichiers et Dossiers à EXCLURE (ne PAS déployer)

### 🚫 Dossiers générés automatiquement

```
node_modules/               ❌ Installé sur le serveur avec npm install
.next/                     ❌ Généré lors du build avec npm run build
out/                       ❌ Généré lors du build (si export statique)
```

### 🚫 Fichiers de développement

```
.env.local                  ❌ Variables d'environnement locales
.env.development            ❌ Variables de développement
*.log                      ❌ Fichiers de logs
.DS_Store                  ❌ Fichiers système macOS
```

### 🚫 Dossiers de scripts et documentation (optionnel)

```
scripts/                    ⚠️ Optionnel (scripts de migration, etc.)
*.md                        ⚠️ Optionnel (documentation)
```

## 🔧 Configuration sur le Serveur

### Étape 1 : Créer le fichier `.env` sur le serveur

**IMPORTANT** : Ne jamais commiter `.env` dans Git. Créez-le directement sur le serveur.

```env
# Base de données PostgreSQL (Supabase)
DATABASE_URL="postgresql://postgres.hrtsiigolatifgyvipyc:Amine%402005wac@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"

# Mot de passe admin (optionnel)
ADMIN_PASSWORD="votre_mot_de_passe_admin"

# URL WordPress (si utilisé)
WORDPRESS_API_URL="http://votre-site-wordpress.com/wp-json"

# Environnement
NODE_ENV="production"
```

### Étape 2 : Commandes à exécuter sur le serveur

```bash
# 1. Installer les dépendances
npm install --production

# 2. Générer le client Prisma
npx prisma generate

# 3. Appliquer les migrations (si nécessaire)
npx prisma migrate deploy

# 4. Builder l'application
npm run build

# 5. Démarrer le serveur
npm start
```

## 📋 Checklist de Déploiement

### Avant le déploiement

- [ ] Vérifier que `.env` n'est PAS dans le dossier à déployer
- [ ] Vérifier que `node_modules` n'est PAS inclus
- [ ] Vérifier que `.next` n'est PAS inclus
- [ ] Vérifier que tous les fichiers source (`src/`) sont présents
- [ ] Vérifier que le dossier `prisma/` est présent avec `schema.prisma`

### Sur le serveur

- [ ] Créer le fichier `.env` avec les bonnes variables
- [ ] Installer Node.js (version 18+ recommandée)
- [ ] Exécuter `npm install`
- [ ] Exécuter `npx prisma generate`
- [ ] Exécuter `npm run build`
- [ ] Configurer un processus manager (PM2, systemd, etc.)
- [ ] Configurer le reverse proxy (Nginx, Apache) si nécessaire

## 🚀 Méthodes de Déploiement

### Option 1 : Déploiement manuel (FTP/SFTP)

1. **Créer une archive** avec les fichiers nécessaires :
   ```bash
   # Sur votre machine locale
   tar -czf deploy.tar.gz \
     --exclude='node_modules' \
     --exclude='.next' \
     --exclude='.env.local' \
     --exclude='*.log' \
     src/ public/ prisma/ package.json package-lock.json \
     next.config.js tsconfig.json tailwind.config.js postcss.config.js
   ```

2. **Transférer** l'archive sur le serveur

3. **Extraire** sur le serveur :
   ```bash
   tar -xzf deploy.tar.gz
   ```

### Option 2 : Git (Recommandé)

1. **Sur le serveur**, cloner le repository :
   ```bash
   git clone https://votre-repo.git quiz-main
   cd quiz-main
   ```

2. **Créer `.env`** sur le serveur

3. **Installer et builder** :
   ```bash
   npm install
   npx prisma generate
   npm run build
   npm start
   ```

### Option 3 : Vercel/Netlify (Automatique)

Ces plateformes gèrent automatiquement le déploiement :
- Connectez votre repository Git
- Configurez les variables d'environnement dans le dashboard
- Le déploiement se fait automatiquement

## 📊 Structure Finale sur le Serveur

```
/var/www/quiz-main/          (ou votre chemin)
├── src/
├── public/
├── prisma/
├── node_modules/            (installé avec npm install)
├── .next/                   (généré avec npm run build)
├── .env                     (créé manuellement)
├── package.json
├── package-lock.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## ⚠️ Points Importants

1. **`.env`** : Ne JAMAIS commiter ce fichier. Créez-le directement sur le serveur avec les bonnes valeurs.

2. **`node_modules`** : Ne pas transférer ce dossier. Il sera installé avec `npm install` sur le serveur.

3. **`.next`** : Ne pas transférer ce dossier. Il sera généré avec `npm run build` sur le serveur.

4. **Prisma** : Le dossier `prisma/` DOIT être présent car il contient le schéma nécessaire pour générer le client Prisma.

5. **Variables d'environnement** : Assurez-vous que toutes les variables nécessaires sont définies dans `.env` sur le serveur.

## 🔍 Vérification Post-Déploiement

```bash
# Vérifier que l'application démarre
npm start

# Vérifier les logs
# (selon votre processus manager)

# Tester l'API
curl http://localhost:3000/api/courses

# Vérifier la connexion à la base de données
npx prisma db pull
```

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du serveur
2. Vérifiez que `.env` est correctement configuré
3. Vérifiez que la base de données PostgreSQL est accessible
4. Vérifiez que tous les ports nécessaires sont ouverts
