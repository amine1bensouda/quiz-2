# 🎯 Proposition : Backend Indépendant pour la Plateforme de Quiz

## Option 1 : Next.js API Routes + Prisma + PostgreSQL (⭐ RECOMMANDÉ)

### Avantages
- ✅ **Tout dans un seul projet** : Pas besoin de serveur séparé
- ✅ **TypeScript partout** : Type-safe de la DB au frontend
- ✅ **Déploiement simple** : Vercel/Netlify gèrent tout
- ✅ **Performance** : API routes Next.js sont très rapides
- ✅ **Contrôle total** : Tu définis exactement ce dont tu as besoin
- ✅ **Évolutif** : Facile d'ajouter des fonctionnalités

### Structure proposée

```
quiz-main/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   └── migrations/            # Migrations DB
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── quizzes/
│   │   │   │   ├── route.ts           # GET /api/quizzes (liste)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # GET/PUT/DELETE /api/quizzes/[id]
│   │   │   ├── questions/
│   │   │   │   └── route.ts           # GET/POST /api/questions
│   │   │   └── admin/
│   │   │       └── quizzes/
│   │   │           └── route.ts       # POST /api/admin/quizzes (création)
│   │   └── admin/                     # Interface admin (optionnel)
│   │       └── quiz/
│   │           └── page.tsx
│   └── lib/
│       ├── db.ts              # Client Prisma
│       └── quiz-service.ts    # Logique métier
```

### Schéma de base de données (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // ou "mysql" ou "sqlite"
  url      = env("DATABASE_URL")
}

model Course {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?
  modules     Module[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Module {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title       String
  slug        String
  order       Int
  quizzes     Quiz[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([courseId, slug])
}

model Quiz {
  id              String     @id @default(cuid())
  moduleId        String?
  module          Module?    @relation(fields: [moduleId], references: [id], onDelete: SetNull)
  title           String
  slug            String     @unique
  description     String?    @db.Text
  duration        Int        @default(10) // minutes
  difficulty      String     @default("Moyen")
  passingGrade    Int        @default(70)
  randomizeOrder  Boolean    @default(false)
  featuredImage   String?
  questions       Question[]
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

model Question {
  id          String   @id @default(cuid())
  quizId      String
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  text        String   @db.Text
  type        String   @default("multiple_choice") // multiple_choice, true_false, etc.
  points      Int      @default(1)
  explanation String?  @db.Text
  order       Int
  answers     Answer[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Answer {
  id          String   @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text        String   @db.Text
  isCorrect   Boolean  @default(false)
  explanation String?  @db.Text
  order       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Installation

```bash
# 1. Installer Prisma
npm install prisma @prisma/client
npm install -D prisma

# 2. Initialiser Prisma
npx prisma init

# 3. Configurer DATABASE_URL dans .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/quiz_db"

# 4. Créer la base de données
npx prisma migrate dev --name init

# 5. Générer le client Prisma
npx prisma generate
```

### Exemple d'API Route

```typescript
// src/app/api/quizzes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/quizzes - Liste tous les quiz
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    
    const quizzes = await prisma.quiz.findMany({
      where: moduleId ? { moduleId } : undefined,
      include: {
        module: {
          include: {
            course: true,
          },
        },
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Erreur API quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Créer un quiz (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, moduleId, description, duration, difficulty, questions } = body;

    const quiz = await prisma.quiz.create({
      data: {
        title,
        slug,
        moduleId,
        description,
        duration: duration || 10,
        difficulty: difficulty || 'Moyen',
        questions: {
          create: questions.map((q: any, index: number) => ({
            text: q.text,
            type: q.type || 'multiple_choice',
            points: q.points || 1,
            explanation: q.explanation,
            order: index,
            answers: {
              create: q.answers.map((a: any, aIndex: number) => ({
                text: a.text,
                isCorrect: a.isCorrect,
                explanation: a.explanation,
                order: aIndex,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Erreur création quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
```

---

## Option 2 : Strapi (Headless CMS)

### Avantages
- ✅ **Interface admin automatique** : Pas besoin de coder l'admin
- ✅ **REST + GraphQL** : Deux APIs disponibles
- ✅ **Gestion des médias** : Upload d'images intégré
- ✅ **Permissions** : Système de rôles intégré
- ✅ **Plugin ecosystem** : Beaucoup d'extensions

### Inconvénients
- ❌ **Serveur séparé** : Nécessite un hébergement dédié
- ❌ **Plus lourd** : Plus de ressources nécessaires
- ❌ **Moins de contrôle** : Dépend de l'architecture Strapi

### Installation

```bash
# Créer un nouveau projet Strapi
npx create-strapi-app@latest quiz-backend --quickstart

# Dans le projet Strapi, créer les Content Types :
# - Course, Module, Quiz, Question, Answer
```

---

## Option 3 : Supabase (Backend as a Service)

### Avantages
- ✅ **PostgreSQL géré** : Base de données hébergée
- ✅ **Auth intégré** : Système d'authentification
- ✅ **Storage** : Stockage de fichiers
- ✅ **Real-time** : WebSockets pour mises à jour en temps réel
- ✅ **Gratuit jusqu'à 500MB**

### Inconvénients
- ❌ **Vendor lock-in** : Dépendance à Supabase
- ❌ **Moins de contrôle** : Limitations de la plateforme

### Installation

```bash
npm install @supabase/supabase-js
```

---

## Option 4 : Node.js/Express séparé

### Avantages
- ✅ **Séparation complète** : Backend et frontend séparés
- ✅ **Flexibilité totale** : Tu contrôles tout
- ✅ **Réutilisable** : Peut servir plusieurs frontends

### Inconvénients
- ❌ **Deux projets** : Plus de complexité
- ❌ **Deux déploiements** : Plus de maintenance
- ❌ **CORS** : Configuration nécessaire

---

## 🎯 Ma Recommandation

**Option 1 : Next.js API Routes + Prisma + PostgreSQL**

Pourquoi ?
1. **Cohérence** : Tu utilises déjà Next.js
2. **Simplicité** : Un seul projet, un seul déploiement
3. **Performance** : API routes Next.js sont très rapides
4. **TypeScript** : Type-safe de bout en bout
5. **Évolutif** : Facile d'ajouter des fonctionnalités

### Plan de migration

1. **Phase 1** : Setup Prisma + DB
   - Installer Prisma
   - Créer le schéma
   - Migrer les données WordPress → PostgreSQL

2. **Phase 2** : Créer les API Routes
   - `/api/quizzes` (GET, POST)
   - `/api/quizzes/[id]` (GET, PUT, DELETE)
   - `/api/questions` (GET, POST)

3. **Phase 3** : Adapter le frontend
   - Remplacer `wordpress.ts` par `quiz-service.ts`
   - Utiliser les nouvelles API routes

4. **Phase 4** : Interface admin (optionnel)
   - Page `/admin/quiz` pour créer/éditer les quiz
   - Formulaire avec validation

---

## 📝 Prochaines étapes

Si tu choisis l'Option 1, je peux :
1. ✅ Créer le schéma Prisma complet
2. ✅ Créer toutes les API routes nécessaires
3. ✅ Créer un service de migration WordPress → PostgreSQL
4. ✅ Créer une interface admin pour gérer les quiz
5. ✅ Adapter le frontend pour utiliser les nouvelles APIs

Dis-moi quelle option tu préfères et je commence l'implémentation ! 🚀
