# 🎯 Backend Indépendant - Documentation Complète

## ✅ Ce qui a été créé

### 1. **Schéma de base de données (Prisma)**
- ✅ `prisma/schema.prisma` : Modèles Course, Module, Quiz, Question, Answer
- ✅ Relations complètes avec cascade delete
- ✅ Support PostgreSQL, MySQL, SQLite

### 2. **Service de base de données**
- ✅ `src/lib/db.ts` : Client Prisma configuré
- ✅ `src/lib/quiz-service.ts` : Fonctions pour gérer les quiz (remplace wordpress.ts)

### 3. **API Routes Next.js**
- ✅ `GET /api/quizzes` : Liste tous les quiz
- ✅ `GET /api/quizzes/[slug]` : Récupère un quiz par slug
- ✅ `POST /api/admin/quizzes` : Crée un quiz (admin)
- ✅ `PUT /api/admin/quizzes/[id]` : Met à jour un quiz
- ✅ `DELETE /api/admin/quizzes/[id]` : Supprime un quiz

### 4. **Script de migration**
- ✅ `scripts/migrate-wordpress-to-prisma.ts` : Migre WordPress → PostgreSQL

### 5. **Adaptation du frontend**
- ✅ `src/lib/wordpress.ts` : Fallback automatique Prisma → WordPress
- ✅ Compatibilité totale : Le site fonctionne avec les deux backends

## 🚀 Installation Rapide

### Étape 1 : Installer PostgreSQL

**Option A : Local (Windows)**
```bash
# Télécharger depuis https://www.postgresql.org/download/windows/
# Installer et noter le mot de passe
```

**Option B : Cloud (Gratuit)**
- **Supabase** : https://supabase.com (gratuit jusqu'à 500MB)
- **Railway** : https://railway.app (gratuit avec crédits)
- **PlanetScale** : https://planetscale.com (gratuit)

### Étape 2 : Configurer la base de données

```bash
# Créer la base de données
createdb quiz_db

# Ou via psql
psql -U postgres
CREATE DATABASE quiz_db;
\q
```

### Étape 3 : Configurer `.env.local`

Copier `.env.example` vers `.env.local` et modifier :

```env
DATABASE_URL="postgresql://postgres:TON_MOT_DE_PASSE@localhost:5432/quiz_db?schema=public"
WORDPRESS_API_URL="http://localhost/test2"
```

### Étape 4 : Créer les tables

```bash
# Créer la migration
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate
```

### Étape 5 : Migrer les données WordPress

```bash
# Migrer tous les quiz WordPress → PostgreSQL
npx ts-node scripts/migrate-wordpress-to-prisma.ts
```

## 📊 Structure de la Base de Données

```
Course (1) ──→ (N) Module (1) ──→ (N) Quiz (1) ──→ (N) Question (1) ──→ (N) Answer
```

- **Course** : Cours (ex: "ACT Math")
- **Module** : Module du cours (ex: "MODULE 1: FUNDAMENTAL QUIZZES")
- **Quiz** : Quiz individuel
- **Question** : Question du quiz
- **Answer** : Réponse à la question

## 🔌 Utilisation des APIs

### Frontend (Server Components)

```typescript
import { getAllQuiz, getQuizBySlug } from '@/lib/quiz-service';

// Récupérer tous les quiz
const quizzes = await getAllQuiz();

// Récupérer un quiz spécifique
const quiz = await getQuizBySlug('mini-exam-15');
```

### Frontend (Client Components)

```typescript
// Utiliser les API routes
const response = await fetch('/api/quizzes');
const quizzes = await response.json();
```

### Créer un quiz (Admin)

```typescript
const response = await fetch('/api/admin/quizzes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Mon Quiz',
    slug: 'mon-quiz',
    moduleId: 'module-id',
    duration: 10,
    difficulty: 'Moyen',
    questions: [
      {
        text: 'Quelle est la réponse ?',
        type: 'multiple_choice',
        points: 1,
        answers: [
          { text: 'Réponse A', isCorrect: true },
          { text: 'Réponse B', isCorrect: false },
        ],
      },
    ],
  }),
});
```

## 🎨 Interface Admin (À venir)

Une interface admin sera créée à `/admin/quiz` pour :
- ✅ Créer/éditer/supprimer des quiz
- ✅ Gérer les questions et réponses
- ✅ Organiser par cours/modules
- ✅ Upload d'images

## 🔄 Migration Progressive

Le système est conçu pour une **migration progressive** :

1. **Phase 1** : WordPress fonctionne toujours (fallback)
2. **Phase 2** : Migrer les données vers PostgreSQL
3. **Phase 3** : Le frontend utilise automatiquement Prisma si disponible
4. **Phase 4** : Désactiver WordPress une fois tout migré

## 🆘 Dépannage

### Erreur "PrismaClient is not configured"

```bash
# Vérifier DATABASE_URL dans .env.local
# Régénérer le client Prisma
npx prisma generate
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL tourne
pg_isready

# Tester la connexion
psql -U postgres -d quiz_db
```

### Erreur lors de la migration

- Vérifier que `WORDPRESS_API_URL` est correct
- Vérifier que l'API Tutor LMS est accessible
- Vérifier les logs dans la console

## 📝 Prochaines Étapes

1. ⏳ Créer l'interface admin (`/admin/quiz`)
2. ⏳ Ajouter l'authentification (NextAuth.js)
3. ⏳ Ajouter la gestion des images (upload)
4. ⏳ Optimiser les performances (cache, indexation)
5. ⏳ Ajouter des statistiques (scores, tentatives)

## 🎉 Avantages du Nouveau Backend

- ✅ **Indépendant de WordPress** : Plus besoin de WordPress
- ✅ **Type-safe** : TypeScript de bout en bout
- ✅ **Performance** : Requêtes optimisées avec Prisma
- ✅ **Évolutif** : Facile d'ajouter des fonctionnalités
- ✅ **Contrôle total** : Tu définis exactement ce dont tu as besoin
