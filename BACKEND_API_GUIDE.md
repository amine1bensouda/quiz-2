# Guide d'accès au Backend Indépendant

## 🚀 Vue d'ensemble

Le backend indépendant est accessible via les **API Routes Next.js** qui utilisent **Prisma** et **SQLite**. Toutes les routes sont disponibles sous `/api/`.

## 📍 Endpoints disponibles

### 1. **GET /api/quizzes** - Liste tous les quiz

Récupère tous les quiz depuis la base de données SQLite.

**URL:** `http://localhost:3000/api/quizzes`

**Paramètres optionnels:**
- `?module=slug-module` - Filtrer par module
- `?limit=10` - Limiter le nombre de résultats

**Exemples:**
```bash
# Tous les quiz
http://localhost:3000/api/quizzes

# Quiz d'un module spécifique
http://localhost:3000/api/quizzes?module=module-1

# Limiter à 10 quiz
http://localhost:3000/api/quizzes?limit=10
```

**Réponse:**
```json
[
  {
    "id": 1,
    "slug": "quiz-slug",
    "title": { "rendered": "Titre du quiz" },
    "content": { "rendered": "Description..." },
    "acf": {
      "duree_estimee": 10,
      "niveau_difficulte": "Moyen",
      "questions": [...]
    },
    "categories": ["module-1"]
  }
]
```

---

### 2. **GET /api/quizzes/[slug]** - Récupère un quiz spécifique

Récupère un quiz complet avec toutes ses questions et réponses.

**URL:** `http://localhost:3000/api/quizzes/[slug]`

**Exemple:**
```bash
http://localhost:3000/api/quizzes/quiz-1
```

**Réponse:**
```json
{
  "id": 1,
  "slug": "quiz-1",
  "title": { "rendered": "Titre du quiz" },
  "acf": {
    "questions": [
      {
        "id": 1,
        "texte_question": "Question 1?",
        "type_question": "QCM",
        "reponses": [
          { "texte": "Réponse 1", "correcte": true },
          { "texte": "Réponse 2", "correcte": false }
        ]
      }
    ]
  }
}
```

---

### 3. **GET /api/categories** - Liste toutes les catégories (modules)

Récupère tous les modules/catégories.

**URL:** `http://localhost:3000/api/categories`

**Réponse:**
```json
[
  {
    "id": 1,
    "name": "Module 1",
    "slug": "module-1",
    "description": "Description du module",
    "count": 20
  }
]
```

---

### 4. **POST /api/admin/quizzes** - Crée un nouveau quiz (Admin)

Crée un nouveau quiz dans la base de données.

**URL:** `http://localhost:3000/api/admin/quizzes`

**Méthode:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Nouveau Quiz",
  "slug": "nouveau-quiz",
  "moduleId": 1,
  "description": "Description du quiz",
  "excerpt": "Résumé",
  "duration": 10,
  "difficulty": "Moyen",
  "passingGrade": 70,
  "randomizeOrder": false,
  "maxQuestions": 10,
  "questions": [
    {
      "text": "Question 1?",
      "type": "multiple_choice",
      "points": 1,
      "explanation": "Explication",
      "order": 0,
      "answers": [
        { "text": "Réponse 1", "isCorrect": true, "order": 0 },
        { "text": "Réponse 2", "isCorrect": false, "order": 1 }
      ]
    }
  ]
}
```

**Réponse (201):**
```json
{
  "id": 101,
  "title": "Nouveau Quiz",
  "slug": "nouveau-quiz",
  ...
}
```

---

### 5. **PUT /api/admin/quizzes/[id]** - Met à jour un quiz (Admin)

Met à jour un quiz existant.

**URL:** `http://localhost:3000/api/admin/quizzes/[id]`

**Méthode:** `PUT`

**Body:** Même format que POST

---

### 6. **DELETE /api/admin/quizzes/[id]** - Supprime un quiz (Admin)

Supprime un quiz de la base de données.

**URL:** `http://localhost:3000/api/admin/quizzes/[id]`

**Méthode:** `DELETE`

**Réponse (200):**
```json
{ "message": "Quiz deleted successfully" }
```

---

## 🧪 Comment tester les endpoints

### 1. **Via le navigateur (GET uniquement)**

Ouvre simplement l'URL dans ton navigateur:
```
http://localhost:3000/api/quizzes
```

### 2. **Via curl (Terminal)**

```bash
# GET - Liste tous les quiz
curl http://localhost:3000/api/quizzes

# GET - Un quiz spécifique
curl http://localhost:3000/api/quizzes/quiz-1

# POST - Créer un quiz
curl -X POST http://localhost:3000/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Quiz",
    "slug": "test-quiz",
    "description": "Description"
  }'

# PUT - Mettre à jour
curl -X PUT http://localhost:3000/api/admin/quizzes/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Quiz modifié"}'

# DELETE - Supprimer
curl -X DELETE http://localhost:3000/api/admin/quizzes/1
```

### 3. **Via PowerShell (Windows)**

```powershell
# GET - Liste tous les quiz
Invoke-RestMethod -Uri "http://localhost:3000/api/quizzes" -Method Get

# POST - Créer un quiz
$body = @{
    title = "Test Quiz"
    slug = "test-quiz"
    description = "Description"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/quizzes" -Method Post -Body $body -ContentType "application/json"
```

### 4. **Via Postman ou Insomnia**

1. Crée une nouvelle requête
2. Sélectionne la méthode (GET, POST, PUT, DELETE)
3. Entrez l'URL: `http://localhost:3000/api/quizzes`
4. Pour POST/PUT, ajoutez le body en JSON dans l'onglet "Body"

---

## 🔄 Comment le frontend utilise ces APIs

Le frontend utilise actuellement un **système de fallback** :

1. **D'abord**, il essaie de récupérer depuis le nouveau backend Prisma (`/api/quizzes`)
2. **Si échec**, il fallback vers WordPress

Le code est dans `src/lib/wordpress.ts` :

```typescript
// Exemple de fallback dans getQuizBySlug
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  try {
    // Essayer d'abord le nouveau backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/quizzes/${slug}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Fallback vers WordPress
  }
  // ... code WordPress
}
```

---

## 📊 Vérifier les données dans la base

### Via Prisma Studio (Interface graphique)

**⚠️ Important:** Prisma Studio nécessite un chemin absolu pour la base de données SQLite.

**Option 1: Utiliser le script PowerShell (Recommandé sur Windows)**
```powershell
.\scripts\start-prisma-studio.ps1
```

**Option 2: Utiliser le script Bash (Linux/Mac)**
```bash
bash scripts/start-prisma-studio.sh
```

**Option 3: Manuellement**
```bash
# Sur Windows PowerShell
$env:DATABASE_URL="file:C:\xampp\htdocs\quiz-main\prisma\dev.db"
npx prisma studio

# Sur Linux/Mac
export DATABASE_URL="file:$(pwd)/prisma/dev.db"
npx prisma studio
```

Ouvre `http://localhost:5555` dans ton navigateur pour voir toutes les tables et données.

**Note:** Si tu rencontres l'erreur "Unable to run script" ou "Cannot fetch data from service", assure-toi que:
1. Le fichier `.env` existe avec `DATABASE_URL` en chemin absolu
2. La base de données `prisma/dev.db` existe
3. Tu utilises le script fourni pour lancer Prisma Studio

### Via le script de test

```bash
npx tsx scripts/test-db-connection.ts
```

---

## 🔐 Sécurité (À implémenter)

⚠️ **Actuellement, les endpoints admin n'ont PAS d'authentification.**

Pour la production, ajoute:
- Authentification JWT
- Vérification des rôles utilisateur
- Rate limiting
- Validation des données

---

## 📝 Exemple complet: Créer un quiz via l'API

```bash
curl -X POST http://localhost:3000/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quiz de Mathématiques",
    "slug": "quiz-math-1",
    "moduleId": 1,
    "description": "Quiz sur les équations",
    "duration": 15,
    "difficulty": "Difficile",
    "passingGrade": 80,
    "questions": [
      {
        "text": "Quelle est la solution de 2x + 5 = 15?",
        "type": "multiple_choice",
        "points": 2,
        "explanation": "2x = 10, donc x = 5",
        "order": 0,
        "answers": [
          { "text": "x = 5", "isCorrect": true, "order": 0 },
          { "text": "x = 10", "isCorrect": false, "order": 1 },
          { "text": "x = 7", "isCorrect": false, "order": 2 }
        ]
      }
    ]
  }'
```

---

## 🎯 Prochaines étapes

1. ✅ Backend opérationnel
2. ✅ Migration WordPress → SQLite terminée
3. ⏳ Créer une interface admin pour gérer les quiz
4. ⏳ Ajouter l'authentification
5. ⏳ Ajouter la validation des données

---

## 📞 Support

Si tu rencontres des problèmes:
1. Vérifie que le serveur Next.js tourne: `npm run dev`
2. Vérifie la connexion à la base: `npx tsx scripts/test-db-connection.ts`
3. Vérifie les logs dans la console du serveur
