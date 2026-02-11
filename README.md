# Plateforme de Quiz WordPress Headless + Next.js

Plateforme de quiz moderne utilisant WordPress comme CMS headless et Next.js pour le frontend.

## 🚀 Fonctionnalités

- **Architecture Headless** : WordPress pour la gestion de contenu, Next.js pour l'affichage
- **Base de données Prisma** : Migration vers Prisma ORM pour une meilleure gestion des données
- **Performance optimale** : Pages statiques pré-générées (SSG) avec revalidation incrémentale (ISR)
- **SEO optimisé** : Schema.org, Open Graph, sitemap automatique
- **Intégration AdSense** : Composants publicitaires prêts à l'emploi
- **Interface moderne** : Design responsive avec Tailwind CSS
- **TypeScript** : Code type-safe pour une meilleure maintenabilité
- **Rendu mathématique** : Support LaTeX avec KaTeX et MathJax pour les formules mathématiques
- **Éditeur WYSIWYG** : Éditeur riche pour les descriptions et questions
- **Système de quiz avancé** : Timer persistant, système de flagging, correction détaillée
- **Types de questions** : QCM, Vrai/Faux, et réponse libre (texte)
- **Panel d'administration** : Interface complète pour gérer les cours, modules et quiz

## 📋 Prérequis

- Node.js 18+ et npm
- WordPress installé avec les plugins requis
- Accès SSH au serveur (pour le déploiement)

## 🛠️ Installation

1. **Cloner et installer les dépendances**

```bash
npm install
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env.local` à la racine du projet (voir `.env.example` pour référence) :

```env
# WordPress API (optionnel si vous utilisez Prisma uniquement)
WORDPRESS_API_URL=https://admin.votresite.com

# Site URL
NEXT_PUBLIC_SITE_URL=https://www.votresite.com

# Database (Prisma) - REQUIS
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# AdSense (optionnel)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX

# Admin credentials (pour le panel d'administration)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

# Revalidation time (en secondes)
NEXT_REVALIDATE_TIME=3600
```

3. **Générer le client Prisma**

```bash
npx prisma generate
```

4. **Migrer la base de données** (si nécessaire)

```bash
npx prisma migrate dev
```

5. **Lancer le serveur de développement**

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:3000`

## 📦 Structure du projet

```
quizz/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   ├── components/       # Composants React
│   │   ├── Ads/         # Composants publicitaires
│   │   ├── Layout/      # Header, Footer, Navigation
│   │   ├── Quiz/        # Composants quiz
│   │   └── SEO/         # Composants SEO
│   └── lib/             # Utilitaires et fonctions
├── public/              # Fichiers statiques
└── package.json
```

## 🔧 Configuration WordPress

### Plugins requis

1. **Custom Post Type UI** - Création des types de contenu (quiz, questions)
2. **Advanced Custom Fields Pro** - Champs personnalisés pour les quiz
3. **WP All Import Pro** - Import en masse des questions
4. **ACF to REST API** - Exposition des champs ACF dans l'API

### Configuration CORS

Ajoutez ce code dans `functions.php` de votre thème WordPress :

```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://www.votresite.com');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);
```

## 🚀 Déploiement

### Déploiement sur Vercel

1. **Connecter le repository GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Importez votre repository GitHub
   - Configurez les variables d'environnement dans les paramètres du projet

2. **Variables d'environnement requises sur Vercel** :
   - `DATABASE_URL` : URL de votre base de données PostgreSQL
   - `NEXT_PUBLIC_SITE_URL` : URL de votre site
   - `ADMIN_EMAIL` : Email de l'administrateur
   - `ADMIN_PASSWORD` : Mot de passe de l'administrateur (hashé avec bcrypt)
   - `WORDPRESS_API_URL` : (optionnel) URL de l'API WordPress

3. **Build automatique**
   - Vercel détectera automatiquement Next.js
   - Le build inclura `prisma generate` grâce au script `postinstall`

### Build de production local

```bash
npm run build
```

### Démarrage du serveur de production local

```bash
npm start
```

## 📝 Notes importantes

- Les pages sont générées statiquement au build avec revalidation ISR
- Les images WordPress doivent être accessibles publiquement
- Configurez `ads.txt` avec votre ID AdSense réel
- Ajustez les URLs dans les fichiers de configuration selon votre domaine

## 📄 Licence

Ce projet est privé et destiné à un usage personnel.

