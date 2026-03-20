# 🎯 Prochaines Étapes - Votre WordPress est Installé

Votre WordPress est maintenant installé sur **http://localhost/quiz-wordpress**

## ✅ Ce qui est fait

- ✅ WordPress installé sur `http://localhost/quiz-wordpress`
- ✅ Configuration Next.js mise à jour dans `.env.local`
- ✅ Code Next.js 100% complet

## 🔴 Étapes Immédiates (À faire maintenant)

### 1. Accéder à l'interface WordPress

Ouvrez votre navigateur et allez sur :

**http://localhost/quiz-wordpress/wp-admin**

Connectez-vous avec vos identifiants WordPress.

### 2. Installer les Plugins Requis

#### Plugin 1 : Custom Post Type UI (GRATUIT)

1. Dans WordPress admin → **Extensions** → **Ajouter**
2. Rechercher **"Custom Post Type UI"**
3. Cliquer **Installer** puis **Activer**

#### Plugin 2 : ACF to REST API (GRATUIT)

1. **Extensions** → **Ajouter**
2. Rechercher **"ACF to REST API"**
3. **Installer** puis **Activer**

#### Plugin 3 : Advanced Custom Fields Pro (À ACHETER - $49/an)

1. Aller sur https://www.advancedcustomfields.com/pro/
2. Acheter la licence (1 site = $49/an)
3. Télécharger le fichier .zip
4. Dans WordPress → **Extensions** → **Ajouter** → **Téléverser**
5. Choisir le fichier .zip téléchargé
6. **Installer** puis **Activer**

> **Note** : Si vous ne voulez pas acheter ACF Pro maintenant, vous pouvez utiliser la version gratuite ACF (mais sans le champ Repeater qui est nécessaire pour les réponses multiples).

### 3. Créer les Custom Post Types

1. Dans WordPress admin → **CPT UI** → **Add/Edit Post Types**

2. **Créer "Quiz"** :
   - Slug : `quiz`
   - Plural Label : `Quiz`
   - Singular Label : `Quiz`
   - **Cocher** : Public, Show in REST API
   - Supports : Title, Editor, Featured Image, Excerpt
   - Cliquer **Add Post Type**

3. **Créer "Question"** :
   - Slug : `question`
   - Plural Label : `Questions`
   - Singular Label : `Question`
   - **Cocher** : Show in REST API
   - Supports : Title, Editor
   - Cliquer **Add Post Type**

### 4. Configurer Advanced Custom Fields

1. **ACF** → **Add New** (ou **Field Groups** → **Add New**)

2. **Créer le groupe "Quiz Details"** :
   - Location Rules : Post Type is equal to Quiz
   - **Ajouter les champs suivants** :

   **a) Durée estimée**
   - Field Label : `Durée estimée`
   - Field Name : `duree_estimee`
   - Field Type : Number
   - Default Value : 10

   **b) Niveau de difficulté**
   - Field Label : `Niveau de difficulté`
   - Field Name : `niveau_difficulte`
   - Field Type : Select
   - Choices :
     ```
     Facile : Facile
     Moyen : Moyen
     Difficile : Difficile
     Expert : Expert
     ```

   **c) Catégorie**
   - Field Label : `Catégorie`
   - Field Name : `categorie`
   - Field Type : Text

   **d) Nombre de questions**
   - Field Label : `Nombre de questions`
   - Field Name : `nombre_questions`
   - Field Type : Number

   **e) Score minimum**
   - Field Label : `Score minimum`
   - Field Name : `score_minimum`
   - Field Type : Number
   - Default Value : 70

   **f) Ordre des questions**
   - Field Label : `Ordre des questions`
   - Field Name : `ordre_questions`
   - Field Type : Select
   - Choices :
     ```
     Fixe : Fixe
     Aleatoire : Aleatoire
     ```

   **g) Questions (Repeater)** - Nécessite ACF Pro
   - Field Label : `Questions`
   - Field Name : `questions`
   - Field Type : Repeater
   - Sub Fields :
     - `texte_question` (Textarea)
     - `type_question` (Select) : QCM, VraiFaux, TexteLibre
     - `media` (Image)
     - `explication` (Textarea)
     - `reponses` (Repeater) :
       - `texte` (Text)
       - `correcte` (True/False)
       - `explication` (Textarea)

3. **Important** : Pour chaque groupe de champs
   - Onglet **Settings**
   - **Cocher** : "Show in REST API"

4. **Publier** le groupe de champs

### 5. Configurer CORS

1. Dans WordPress, allez dans **Apparence** → **Éditeur de thème**
2. Ouvrir **functions.php**
3. Ajouter ce code à la fin :

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

4. **Mettre à jour le fichier**

### 6. Tester l'API WordPress

Ouvrez votre navigateur et allez sur :

**http://localhost/quiz-wordpress/wp-json/wp/v2/quiz**

Vous devriez voir une réponse JSON (probablement vide `[]` pour l'instant, c'est normal).

### 7. Créer un Quiz de Test

1. Dans WordPress → **Quiz** → **Ajouter**

2. **Remplir** :
   - Titre : "Quiz de test - Histoire de France"
   - Description : "Testez vos connaissances sur l'histoire de France"
   - Image à la une : (optionnel, mais recommandé)

3. **Remplir les champs ACF** :
   - Durée estimée : 10
   - Niveau de difficulté : Moyen
   - Catégorie : Histoire
   - Nombre de questions : 3
   - Score minimum : 70
   - Ordre des questions : Fixe

4. **Ajouter des questions** (dans le Repeater "Questions") :
   
   **Question 1** :
   - Texte : "Quelle est la capitale de la France ?"
   - Type : QCM
   - Réponses :
     - "Paris" → Correcte : Oui
     - "Lyon" → Correcte : Non
     - "Marseille" → Correcte : Non
     - "Bordeaux" → Correcte : Non
   - Explication : "Paris est la capitale de la France depuis le Moyen Âge."

   **Question 2** :
   - Texte : "En quelle année a eu lieu la Révolution française ?"
   - Type : QCM
   - Réponses :
     - "1789" → Correcte : Oui
     - "1792" → Correcte : Non
     - "1815" → Correcte : Non
   - Explication : "La Révolution française a commencé en 1789."

   **Question 3** :
   - Texte : "Qui était le roi de France en 1789 ?"
   - Type : QCM
   - Réponses :
     - "Louis XVI" → Correcte : Oui
     - "Louis XIV" → Correcte : Non
     - "Napoléon" → Correcte : Non
   - Explication : "Louis XVI était roi de France en 1789."

5. **Publier** le quiz

### 8. Vérifier que le Quiz Apparaît dans l'API

Allez sur : **http://localhost/quiz-wordpress/wp-json/wp/v2/quiz**

Vous devriez voir votre quiz en JSON avec tous les champs ACF.

### 9. Tester sur Next.js

1. **Redémarrer** le serveur Next.js (si en cours) :
   ```bash
   # Arrêter avec Ctrl+C
   npm run dev
   ```

2. **Ouvrir** http://localhost:3000

3. **Vérifier** :
   - Le quiz apparaît sur la page d'accueil
   - Vous pouvez cliquer dessus
   - Le lecteur de quiz fonctionne
   - Vous pouvez répondre aux questions
   - Les résultats s'affichent correctement

## ✅ Checklist de Vérification

- [ ] WordPress accessible sur http://localhost/quiz-wordpress/wp-admin
- [ ] Custom Post Type UI installé et activé
- [ ] ACF to REST API installé et activé
- [ ] Advanced Custom Fields Pro installé et activé
- [ ] Custom Post Types "Quiz" et "Question" créés
- [ ] Groupe de champs ACF "Quiz Details" créé
- [ ] "Show in REST API" activé pour ACF
- [ ] CORS configuré dans functions.php
- [ ] API accessible : http://localhost/quiz-wordpress/wp-json/wp/v2/quiz
- [ ] Un quiz de test créé avec 3 questions
- [ ] Quiz visible sur http://localhost:3000

## 🎉 Une fois tout cela fait

Votre site sera **100% fonctionnel** ! Vous pourrez :
- Voir vos quiz sur le site Next.js
- Jouer aux quiz
- Voir les résultats
- Ajouter autant de quiz que vous voulez

## 📝 Besoin d'aide ?

Si vous avez des questions ou rencontrez des problèmes :
1. Vérifiez les guides : `WORDPRESS_SETUP.md`
2. Vérifiez les logs dans la console du navigateur (F12)
3. Vérifiez les logs Next.js dans le terminal





