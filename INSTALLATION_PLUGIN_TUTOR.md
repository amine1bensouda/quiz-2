# 🔌 Installation du Plugin Tutor LMS REST API

## 📋 Problème

Tutor LMS n'expose pas ses quiz via l'API REST WordPress standard, d'où l'erreur 404.

## ✅ Solution

Un plugin WordPress a été créé pour exposer les quiz Tutor LMS via REST API.

## 📁 Fichier du Plugin

Le plugin se trouve dans :
```
C:\xampp\htdocs\test2\wp-content\plugins\tutor-lms-rest-api\tutor-lms-rest-api.php
```

## 🚀 Installation

### Étape 1 : Vérifier que le dossier existe

Le dossier du plugin devrait déjà être créé. Sinon, créez-le :
```
C:\xampp\htdocs\test2\wp-content\plugins\tutor-lms-rest-api\
```

### Étape 2 : Activer le Plugin

1. **Connectez-vous à WordPress** : `http://localhost/test2/wp-admin`
2. **Allez dans** : Extensions → Extensions installées
3. **Cherchez** : "Tutor LMS REST API"
4. **Cliquez sur** : Activer

### Étape 3 : Vérifier l'API

Testez les nouveaux endpoints :

1. **Tous les quiz** :
   ```
   http://localhost/test2/wp-json/tutor/v1/quizzes
   ```

2. **Un quiz spécifique** (remplacez `1` par l'ID de votre quiz) :
   ```
   http://localhost/test2/wp-json/tutor/v1/quiz/1
   ```

3. **Questions d'un quiz** :
   ```
   http://localhost/test2/wp-json/tutor/v1/quiz/1/questions
   ```

## 📊 Endpoints Disponibles

### GET `/wp-json/tutor/v1/quizzes`
Récupère tous les quiz publiés.

**Paramètres** :
- `per_page` : Nombre de quiz par page (défaut: 100)
- `page` : Numéro de page (défaut: 1)

**Réponse** :
```json
[
  {
    "ID": 123,
    "post_title": "Titre du Quiz",
    "post_name": "slug-du-quiz",
    "time_limit": 10,
    "passing_grade": 70,
    "question_count": 5
  }
]
```

### GET `/wp-json/tutor/v1/quiz/{id}`
Récupère un quiz spécifique par son ID.

### GET `/wp-json/tutor/v1/quiz/{id}/questions`
Récupère toutes les questions d'un quiz.

**Réponse** :
```json
[
  {
    "question_id": 789,
    "question_title": "Texte de la question",
    "question_type": "multiple_choice",
    "points": 1,
    "answers": [
      {
        "answer_title": "Réponse 1",
        "is_correct": true
      }
    ]
  }
]
```

## ⚠️ Dépannage

### Le plugin n'apparaît pas

1. Vérifiez que le fichier existe :
   ```
   C:\xampp\htdocs\test2\wp-content\plugins\tutor-lms-rest-api\tutor-lms-rest-api.php
   ```

2. Vérifiez les permissions du fichier

3. Vérifiez qu'il n'y a pas d'erreurs PHP dans le fichier

### Erreur 404 sur les endpoints

1. **Réinitialisez les permaliens** :
   - Réglages → Permaliens
   - Cliquez sur "Enregistrer les modifications" (sans rien changer)

2. **Vérifiez que Tutor LMS est actif**

3. **Vérifiez les logs d'erreur WordPress**

### Questions vides

1. Vérifiez que les quiz ont des questions assignées dans Tutor LMS
2. Vérifiez que les tables de base de données existent :
   - `wp_tutor_quiz_questions`
   - `wp_tutor_quiz_question_answers`

## 🔧 Structure de la Base de Données

Le plugin accède directement aux tables Tutor LMS :
- `{prefix}_tutor_quiz_questions` : Questions
- `{prefix}_tutor_quiz_question_answers` : Réponses

## ✅ Vérification Finale

Une fois le plugin activé, testez dans Next.js :

```bash
npm run dev
```

Les quiz devraient maintenant s'afficher correctement !



