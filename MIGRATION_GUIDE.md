# 🚀 Guide de Migration : WordPress → PostgreSQL (Prisma)

## 📋 Prérequis

1. **PostgreSQL installé** (ou MySQL/SQLite)
   - Local : Installer PostgreSQL
   - Cloud : Utiliser Supabase, Railway, ou PlanetScale (gratuit)

2. **Variables d'environnement configurées**

## 🔧 Configuration

### 1. Créer la base de données

```bash
# PostgreSQL
createdb quiz_db

# Ou via psql
psql -U postgres
CREATE DATABASE quiz_db;
```

### 2. Configurer `.env.local`

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/quiz_db?schema=public"

# WordPress (pour la migration)
WORDPRESS_API_URL="http://localhost/test2"

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Pour Supabase (gratuit) :**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### 3. Créer les tables (migration Prisma)

```bash
# Créer la migration
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate
```

### 4. Migrer les données WordPress → PostgreSQL

```bash
# Exécuter le script de migration
npx ts-node scripts/migrate-wordpress-to-prisma.ts
```

Le script va :
- ✅ Créer le cours "ACT Math"
- ✅ Créer tous les modules depuis `course-structure.ts`
- ✅ Migrer tous les quiz WordPress
- ✅ Migrer toutes les questions et réponses

## 🔄 Adapter le Frontend

### Option A : Utiliser les nouvelles APIs (recommandé)

Modifier `src/lib/wordpress.ts` pour utiliser `quiz-service.ts` :

```typescript
// src/lib/wordpress.ts
import { 
  getAllQuiz as getAllQuizFromService,
  getQuizBySlug as getQuizBySlugFromService,
  getAllQuizSlugs as getAllQuizSlugsFromService,
  getAllCategories as getAllCategoriesFromService,
} from './quiz-service';

// Remplacer les fonctions existantes
export async function getAllQuiz() {
  return getAllQuizFromService();
}

export async function getQuizBySlug(slug: string) {
  return getQuizBySlugFromService(slug);
}

// etc...
```

### Option B : Utiliser directement les API Routes

Modifier `src/lib/wordpress.ts` pour appeler les API routes :

```typescript
// src/lib/wordpress.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function getAllQuiz() {
  const response = await fetch(`${API_BASE}/api/quizzes`);
  return response.json();
}
```

## ✅ Vérification

1. **Tester les API Routes :**
   ```bash
   # Liste des quiz
   curl http://localhost:3000/api/quizzes
   
   # Un quiz spécifique
   curl http://localhost:3000/api/quizzes/mini-exam-15
   ```

2. **Vérifier la base de données :**
   ```bash
   npx prisma studio
   # Ouvre une interface graphique pour voir les données
   ```

3. **Tester le frontend :**
   - Aller sur `http://localhost:3000/quiz`
   - Vérifier que les quiz s'affichent correctement

## 🎯 Prochaines Étapes

1. ✅ Migration terminée
2. ⏳ Créer l'interface admin (`/admin/quiz`)
3. ⏳ Ajouter l'authentification (NextAuth.js)
4. ⏳ Ajouter la gestion des images (upload)
5. ⏳ Optimiser les performances (cache, indexation)

## 🆘 Dépannage

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL tourne
pg_isready

# Vérifier la connexion
psql -U postgres -d quiz_db
```

### Erreur "Table does not exist"

```bash
# Réexécuter les migrations
npx prisma migrate reset
npx prisma migrate dev
```

### Erreur lors de la migration WordPress

- Vérifier que `WORDPRESS_API_URL` est correct
- Vérifier que l'API Tutor LMS est accessible
- Vérifier les logs dans la console
