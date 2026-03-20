# Structure du Projet - Plateforme de Quiz

## 📁 Arborescence Complète

```
quizz/
├── .eslintrc.json          # Configuration ESLint
├── .gitignore              # Fichiers ignorés par Git
├── DEPLOYMENT.md           # Guide de déploiement
├── WORDPRESS_SETUP.md      # Guide de configuration WordPress
├── PROJECT_STRUCTURE.md    # Ce fichier
├── README.md               # Documentation principale
├── next-env.d.ts           # Types TypeScript Next.js
├── next.config.js          # Configuration Next.js
├── package.json            # Dépendances npm
├── postcss.config.js       # Configuration PostCSS
├── tailwind.config.js      # Configuration Tailwind CSS
├── tsconfig.json           # Configuration TypeScript
│
├── public/                 # Fichiers statiques
│   ├── ads.txt            # Configuration AdSense
│   └── robots.txt         # Instructions pour robots
│
└── src/
    ├── app/               # Pages Next.js (App Router)
    │   ├── layout.tsx     # Layout global
    │   ├── page.tsx        # Page d'accueil
    │   ├── globals.css     # Styles globaux
    │   ├── not-found.tsx   # Page 404
    │   ├── a-propos/
    │   │   └── page.tsx    # Page À propos
    │   ├── quiz/
    │   │   ├── page.tsx    # Liste de tous les quiz
    │   │   └── [slug]/
    │   │       └── page.tsx # Page individuelle d'un quiz
    │   └── categorie/
    │       └── [slug]/
    │           └── page.tsx # Quiz par catégorie
    │
    ├── components/         # Composants React
    │   ├── Ads/           # Composants publicitaires
    │   │   ├── AdSense.tsx
    │   │   ├── DisplayAd.tsx
    │   │   ├── InArticleAd.tsx
    │   │   └── SidebarAd.tsx
    │   │
    │   ├── Layout/        # Composants de mise en page
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Navigation.tsx
    │   │   └── Sidebar.tsx
    │   │
    │   ├── Quiz/          # Composants quiz
    │   │   ├── QuizCard.tsx
    │   │   ├── QuizPlayer.tsx
    │   │   ├── Question.tsx
    │   │   ├── AnswerButton.tsx
    │   │   └── Results.tsx
    │   │
    │   └── SEO/           # Composants SEO
    │       ├── QuizSchema.tsx
    │       └── BreadcrumbSchema.tsx
    │
    └── lib/               # Utilitaires et fonctions
        ├── types.ts       # Types TypeScript
        ├── constants.ts   # Constantes du site
        ├── wordpress.ts   # Client API WordPress
        └── utils.ts       # Fonctions utilitaires
```

## 🎯 Composants Principaux

### Pages (App Router)

- **`app/page.tsx`** : Page d'accueil avec statistiques et quiz en vedette
- **`app/quiz/page.tsx`** : Liste de tous les quiz disponibles
- **`app/quiz/[slug]/page.tsx`** : Page individuelle d'un quiz avec lecteur interactif
- **`app/categorie/[slug]/page.tsx`** : Quiz filtrés par catégorie
- **`app/a-propos/page.tsx`** : Page informative

### Composants Quiz

- **`QuizCard`** : Carte de présentation d'un quiz (liste)
- **`QuizPlayer`** : Lecteur de quiz interactif complet
- **`Question`** : Affichage d'une question avec réponses
- **`AnswerButton`** : Bouton de réponse individuel
- **`Results`** : Écran de résultats avec score et statistiques

### Composants Layout

- **`Header`** : En-tête du site avec navigation
- **`Footer`** : Pied de page avec liens
- **`Navigation`** : Navigation par catégories
- **`Sidebar`** : Barre latérale avec catégories et publicités

### Composants Publicitaires

- **`AdSense`** : Composant de base pour Google AdSense
- **`DisplayAd`** : Publicité display standard
- **`InArticleAd`** : Publicité dans le contenu
- **`SidebarAd`** : Publicité latérale sticky

### Composants SEO

- **`QuizSchema`** : Schema.org pour les quiz (rich snippets)
- **`BreadcrumbSchema`** : Fil d'Ariane structuré

## 🔧 Fichiers de Configuration

### Next.js

- **`next.config.js`** : Configuration Next.js (images, headers, compression)
- **`tsconfig.json`** : Configuration TypeScript
- **`tailwind.config.js`** : Configuration Tailwind CSS
- **`postcss.config.js`** : Configuration PostCSS

### Utilitaires

- **`lib/wordpress.ts`** : Client API pour communiquer avec WordPress
  - `getAllQuiz()` : Récupère tous les quiz
  - `getQuizBySlug()` : Récupère un quiz par slug
  - `getQuizByCategory()` : Récupère les quiz d'une catégorie
  - `getAllCategories()` : Récupère toutes les catégories
  - `getStats()` : Récupère les statistiques globales

- **`lib/types.ts`** : Définitions TypeScript
  - `Quiz` : Type pour un quiz
  - `Question` : Type pour une question
  - `Answer` : Type pour une réponse
  - `Category` : Type pour une catégorie
  - `Stats` : Type pour les statistiques

- **`lib/constants.ts`** : Constantes du site
  - Niveaux de difficulté
  - Catégories par défaut
  - Configuration AdSense
  - Temps de revalidation ISR

- **`lib/utils.ts`** : Fonctions utilitaires
  - Formatage de dates, durées, nombres
  - Génération de slugs
  - Mélange de tableaux
  - Extraction de texte HTML

## 📦 Dépendances Principales

### Production

- **next** : Framework React
- **react** & **react-dom** : Bibliothèque UI
- **axios** : Client HTTP pour API WordPress
- **next-seo** : Optimisation SEO
- **sharp** : Optimisation d'images

### Développement

- **typescript** : Typage statique
- **tailwindcss** : Framework CSS
- **eslint** : Linter de code

## 🚀 Fonctionnalités Implémentées

✅ Architecture headless WordPress + Next.js
✅ Pages statiques pré-générées (SSG)
✅ Revalidation incrémentale (ISR)
✅ Intégration Google AdSense
✅ Optimisation SEO (Schema.org, Open Graph)
✅ Design responsive avec Tailwind CSS
✅ TypeScript pour la sécurité de type
✅ Gestion des quiz interactifs
✅ Système de résultats et scores
✅ Navigation par catégories
✅ Barre de progression
✅ Explications des réponses
✅ Support des images dans les questions

## 📝 Prochaines Étapes

1. Configurer WordPress selon `WORDPRESS_SETUP.md`
2. Configurer les variables d'environnement
3. Tester la connexion API WordPress
4. Déployer selon `DEPLOYMENT.md`
5. Configurer AdSense avec vos IDs réels
6. Importer les 3000+ questions via WP All Import

