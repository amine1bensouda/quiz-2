# 🧪 Guide de Test - Tutor LMS

## ✅ Configuration Terminée

Le code a été adapté pour utiliser Tutor LMS au lieu d'ACF.

### Changements Effectués

1. **URL WordPress** : `http://localhost/test2`
2. **Endpoints** :
   - Quiz : `/wp-json/wp/v2/tutor_quiz`
   - Questions : `/wp-json/tutor/v1/quiz/{id}/questions`
3. **Normalisation automatique** des données Tutor LMS

## 🧪 Tests à Effectuer

### Test 1 : Vérifier l'API WordPress

Ouvrez dans votre navigateur :
```
http://localhost/test2/wp-json/wp/v2/tutor_quiz
```

**Résultat attendu** : Liste JSON des quiz (peut être vide `[]`)

### Test 2 : Vérifier les Questions d'un Quiz

Si vous avez un quiz avec l'ID `1`, testez :
```
http://localhost/test2/wp-json/tutor/v1/quiz/1/questions
```

**Résultat attendu** : Liste JSON des questions du quiz

### Test 3 : Démarrer Next.js

```bash
cd C:\xampp\htdocs\quizz
npm run dev
```

Ouvrez : `http://localhost:3000`

### Test 4 : Vérifier l'Affichage

1. **Page d'accueil** : Doit afficher les quiz disponibles
2. **Page quiz** : Doit afficher la liste des quiz
3. **Page quiz individuel** : Doit afficher les questions

## 🔍 Debugging

### Console du Navigateur (F12)

Vérifiez les erreurs dans la console :
- Erreurs CORS
- Erreurs 404
- Erreurs de format de données

### Console Serveur Next.js

Vérifiez les logs :
- Erreurs de connexion à WordPress
- Erreurs de parsing des données

## ⚠️ Problèmes Courants

### 1. Erreur 404 sur `/tutor_quiz`

**Solution** :
- Vérifiez que Tutor LMS est activé dans WordPress
- Vérifiez que l'API REST est activée

### 2. Erreur CORS

**Solution** : Ajoutez dans `functions.php` du thème WordPress :
```php
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

### 3. Questions vides

**Vérifications** :
- Les quiz ont-ils des questions assignées dans Tutor LMS ?
- L'endpoint `/tutor/v1/quiz/{id}/questions` fonctionne-t-il ?
- Vérifiez la structure des données retournées

### 4. Format de données différent

Si Tutor LMS retourne un format différent, modifiez les fonctions de normalisation dans `src/lib/wordpress.ts` :
- `normalizeTutorQuestion()`
- `normalizeTutorQuiz()`

## 📊 Structure des Données Attendues

### Quiz Tutor LMS
```json
{
  "ID": 123,
  "post_title": "Titre",
  "post_name": "slug",
  "featured_image_id": 456
}
```

### Questions Tutor LMS
```json
{
  "question_id": 789,
  "question_title": "Question ?",
  "question_type": "multiple_choice",
  "answers": [
    {
      "answer_title": "Réponse",
      "is_correct": true
    }
  ]
}
```

## ✅ Checklist

- [ ] API WordPress accessible : `http://localhost/test2/wp-json/wp/v2/tutor_quiz`
- [ ] Endpoint questions accessible : `/tutor/v1/quiz/{id}/questions`
- [ ] CORS configuré (si nécessaire)
- [ ] Next.js démarre sans erreur
- [ ] Quiz s'affichent sur la page d'accueil
- [ ] Questions s'affichent dans un quiz
- [ ] Timer fonctionne (si configuré)
- [ ] Sauvegarde de progression fonctionne
- [ ] Résultats s'affichent correctement

## 🚀 Prochaines Étapes

Une fois les tests validés :
1. Créer des quiz de test dans Tutor LMS
2. Vérifier l'affichage complet
3. Tester toutes les fonctionnalités (timer, progression, partage)
4. Configurer Google Analytics (optionnel)



