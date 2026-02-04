# ⚡ Configuration Rapide - WordPress + Next.js

Votre WordPress est installé sur **http://localhost/quiz-wordpress**

## 🎯 Étapes Rapides (15-20 minutes)

### Étape 1 : Accéder à WordPress (2 min)

1. Ouvrez : **http://localhost/quiz-wordpress/wp-admin**
2. Connectez-vous avec vos identifiants

### Étape 2 : Installer les Plugins (5 min)

#### Plugin 1 : Custom Post Type UI
- **Extensions** → **Ajouter** → Rechercher "Custom Post Type UI"
- **Installer** → **Activer**

#### Plugin 2 : ACF to REST API  
- **Extensions** → **Ajouter** → Rechercher "ACF to REST API"
- **Installer** → **Activer**

#### Plugin 3 : Advanced Custom Fields Pro
- Acheter sur : https://www.advancedcustomfields.com/pro/ ($49/an)
- **Extensions** → **Ajouter** → **Téléverser** → Choisir le .zip
- **Installer** → **Activer**

### Étape 3 : Créer les Custom Post Types (3 min)

1. **CPT UI** → **Add/Edit Post Types**

2. **Créer "Quiz"** :
   ```
   Slug: quiz
   Label: Quiz
   ✅ Public
   ✅ Show in REST API
   ```

3. **Créer "Question"** :
   ```
   Slug: question
   Label: Question
   ✅ Show in REST API
   ```

### Étape 4 : Configurer ACF (5 min)

1. **ACF** → **Add New**

2. **Nom du groupe** : "Quiz Details"

3. **Location** : Post Type is equal to Quiz

4. **Ajouter ces champs** :

| Label | Name | Type | Options |
|-------|------|------|---------|
| Durée estimée | `duree_estimee` | Number | Default: 10 |
| Niveau de difficulté | `niveau_difficulte` | Select | Facile, Moyen, Difficile, Expert |
| Catégorie | `categorie` | Text | |
| Nombre de questions | `nombre_questions` | Number | |
| Score minimum | `score_minimum` | Number | Default: 70 |
| Ordre des questions | `ordre_questions` | Select | Fixe, Aleatoire |
| Questions | `questions` | Repeater | (Voir détails ci-dessous) |

5. **Dans le Repeater "Questions"**, ajouter :
   - `texte_question` (Textarea)
   - `type_question` (Select) : QCM, VraiFaux
   - `explication` (Textarea)
   - `reponses` (Repeater) :
     - `texte` (Text)
     - `correcte` (True/False)
     - `explication` (Textarea)

6. **Settings** → ✅ **Show in REST API**

7. **Publier**

### Étape 5 : Configurer CORS (2 min)

1. **Apparence** → **Éditeur de thème** → **functions.php**

2. **Ajouter à la fin** :

```php
// Autoriser CORS pour Next.js
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

3. **Mettre à jour le fichier**

### Étape 6 : Tester l'API (1 min)

Ouvrez : **http://localhost/quiz-wordpress/wp-json/wp/v2/quiz**

Vous devriez voir : `[]` (vide, c'est normal)

### Étape 7 : Créer un Quiz de Test (5 min)

1. **Quiz** → **Ajouter**

2. **Remplir** :
   - Titre : "Quiz Test - Histoire"
   - Description : "Un quiz de test"
   - Image à la une : (optionnel)

3. **Champs ACF** :
   - Durée : 10
   - Difficulté : Moyen
   - Catégorie : Histoire
   - Questions : 2
   - Score min : 70

4. **Ajouter 2 questions** dans le Repeater :

   **Q1** : "Quelle est la capitale de la France ?"
   - Réponses : Paris (✓), Lyon, Marseille
   - Explication : "Paris est la capitale"

   **Q2** : "En quelle année la Révolution française ?"
   - Réponses : 1789 (✓), 1792, 1815
   - Explication : "La Révolution a commencé en 1789"

5. **Publier**

### Étape 8 : Vérifier sur Next.js (1 min)

1. **Redémarrer** Next.js si nécessaire :
   ```bash
   npm run dev
   ```

2. **Ouvrir** : http://localhost:3000

3. **Vérifier** : Le quiz apparaît et fonctionne !

## ✅ Checklist Finale

- [ ] Plugins installés
- [ ] Custom Post Types créés
- [ ] ACF configuré avec "Show in REST API"
- [ ] CORS configuré
- [ ] Quiz de test créé
- [ ] Quiz visible sur Next.js

## 🎉 C'est Fait !

Votre plateforme est maintenant **100% fonctionnelle** !

Vous pouvez maintenant :
- Créer autant de quiz que vous voulez
- Ajouter des questions
- Tout apparaîtra automatiquement sur Next.js

---

**Besoin d'aide ?** Consultez `PROCHAINES_ETAPES.md` pour plus de détails.





