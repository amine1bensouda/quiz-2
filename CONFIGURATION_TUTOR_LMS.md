# 🔧 Configuration pour Tutor LMS

Ce guide explique comment connecter Next.js à votre site WordPress avec Tutor LMS.

## 📍 Localisation

Votre site WordPress avec Tutor LMS se trouve dans :
```
C:\xampp\htdocs\test2
```

## ✅ Configuration Effectuée

### 1. URL WordPress

L'URL a été configurée pour pointer vers votre installation :
```
WORDPRESS_API_URL=http://localhost/test2
```

### 2. Endpoints Tutor LMS

Le code utilise maintenant les endpoints Tutor LMS :
- **Quiz** : `/wp-json/wp/v2/tutor_quiz`
- **Questions** : `/wp-json/tutor/v1/quiz/{id}/questions`

## 🔍 Vérification

### Étape 1 : Vérifier que Tutor LMS expose l'API

Ouvrez dans votre navigateur :
```
http://localhost/test2/wp-json/wp/v2/tutor_quiz
```

Vous devriez voir une liste de quiz (même si vide `[]`).

### Étape 2 : Vérifier les questions d'un quiz

Si vous avez un quiz avec l'ID `123`, testez :
```
http://localhost/test2/wp-json/tutor/v1/quiz/123/questions
```

### Étape 3 : Configurer CORS (si nécessaire)

Si vous avez des erreurs CORS, ajoutez dans `functions.php` de votre thème WordPress :

```php
// Autoriser CORS pour l'API REST
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: http://localhost:3000');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        return $value;
    });
}, 15);
```

## 📊 Structure des Données Tutor LMS

### Quiz
```json
{
  "ID": 123,
  "post_title": "Titre du Quiz",
  "post_name": "slug-du-quiz",
  "post_content": "Description",
  "featured_image_id": 456,
  "time_limit": 10,
  "difficulty": "Moyen",
  "passing_grade": 70
}
```

### Questions
```json
{
  "question_id": 789,
  "question_title": "Texte de la question",
  "question_type": "multiple_choice",
  "answers": [
    {
      "answer_title": "Réponse 1",
      "is_correct": true
    },
    {
      "answer_title": "Réponse 2",
      "is_correct": false
    }
  ]
}
```

## 🔄 Normalisation Automatique

Le code convertit automatiquement les données Tutor LMS vers le format utilisé par l'application :

- `post_title` → `title.rendered`
- `question_title` → `texte_question`
- `answers` → `reponses` (avec `texte` et `correcte`)
- `is_correct` → `correcte` (boolean)

## 🚀 Test

1. **Démarrer Next.js** :
   ```bash
   npm run dev
   ```

2. **Ouvrir** : `http://localhost:3000`

3. **Vérifier** que les quiz s'affichent correctement

## ⚠️ Problèmes Courants

### Erreur 404 sur `/tutor_quiz`
- Vérifiez que Tutor LMS est activé
- Vérifiez que l'API REST est activée dans WordPress

### Erreur CORS
- Ajoutez le code CORS dans `functions.php`
- Vérifiez que l'URL dans le header correspond à votre frontend

### Questions vides
- Vérifiez que les quiz ont des questions assignées dans Tutor LMS
- Vérifiez l'endpoint `/tutor/v1/quiz/{id}/questions`

## 📝 Variables d'Environnement

Fichier `.env.local` :
```env
WORDPRESS_API_URL=http://localhost/test2
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 🎯 Prochaines Étapes

1. ✅ Configuration Tutor LMS terminée
2. ⏳ Tester avec des quiz réels
3. ⏳ Vérifier l'affichage des questions
4. ⏳ Tester le timer et la sauvegarde de progression



