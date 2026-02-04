# Plateforme de Quiz WordPress Headless + Next.js

Plateforme de quiz moderne utilisant WordPress comme CMS headless et Next.js pour le frontend.

## 🚀 Fonctionnalités

- **Architecture Headless** : WordPress pour la gestion de contenu, Next.js pour l'affichage
- **Performance optimale** : Pages statiques pré-générées (SSG) avec revalidation incrémentale (ISR)
- **SEO optimisé** : Schema.org, Open Graph, sitemap automatique
- **Intégration AdSense** : Composants publicitaires prêts à l'emploi
- **Interface moderne** : Design responsive avec Tailwind CSS
- **TypeScript** : Code type-safe pour une meilleure maintenabilité

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

Créez un fichier `.env.local` à la racine du projet :

```env
WORDPRESS_API_URL=https://admin.votresite.com
NEXT_PUBLIC_SITE_URL=https://www.votresite.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
NEXT_REVALIDATE_TIME=3600
```

3. **Lancer le serveur de développement**

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

### Build de production

```bash
npm run build
```

### Démarrage du serveur de production

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

