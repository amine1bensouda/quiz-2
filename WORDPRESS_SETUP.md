# Configuration WordPress - Guide Complet

Ce guide vous explique comment configurer WordPress pour fonctionner avec le frontend Next.js.

## 📋 Plugins Requis

### 1. Custom Post Type UI (Gratuit)

**Installation :**
- Extensions → Ajouter
- Rechercher "Custom Post Type UI"
- Installer + Activer

**Configuration :**
1. Aller dans CPT UI → Add/Edit Post Types
2. Créer un nouveau type de contenu "Quiz" :
   - Slug : `quiz`
   - Label : `Quiz`
   - Activer "Public" et "Show in REST API"
3. Créer un nouveau type de contenu "Question" :
   - Slug : `question`
   - Label : `Question`
   - Activer "Public" et "Show in REST API"

### 2. Advanced Custom Fields Pro ($49/an ou $299 lifetime)

**Achat :**
- Site : https://www.advancedcustomfields.com/pro/
- Télécharger le plugin
- Installer via Extensions → Ajouter → Téléverser

**Configuration pour Quiz :**

Créer un groupe de champs "Quiz Details" :

1. **Durée estimée** (Number)
   - Nom : `duree_estimee`
   - Type : Number
   - Valeur par défaut : 10

2. **Niveau de difficulté** (Select)
   - Nom : `niveau_difficulte`
   - Type : Select
   - Choix : Facile, Moyen, Difficile, Expert

3. **Catégorie** (Text)
   - Nom : `categorie`
   - Type : Text

4. **Nombre de questions** (Number)
   - Nom : `nombre_questions`
   - Type : Number

5. **Score minimum** (Number)
   - Nom : `score_minimum`
   - Type : Number
   - Valeur par défaut : 70

6. **Ordre des questions** (Select)
   - Nom : `ordre_questions`
   - Type : Select
   - Choix : Fixe, Aleatoire

7. **Questions** (Repeater)
   - Nom : `questions`
   - Type : Repeater
   - Sous-champs :
     - `texte_question` (Textarea)
     - `type_question` (Select) : QCM, VraiFaux, TexteLibre, Image
     - `media` (Image)
     - `explication` (Textarea)
     - `reponses` (Repeater) :
       - `texte` (Text)
       - `correcte` (True/False)
       - `explication` (Textarea)

**Assigner le groupe au type de contenu "Quiz"**

### 3. WP All Import Pro ($99/an ou $299 lifetime)

**Achat :**
- Site : https://www.wpallimport.com/
- Télécharger le plugin
- Installer via Extensions → Ajouter → Téléverser

**Utilisation :**
- Permet d'importer les 3000+ questions depuis un fichier CSV/XML
- Créer un mapping entre les colonnes et les champs ACF
- Import en masse avec gestion des relations

**Alternative gratuite :**
- WP All Import (version gratuite)
- Limite : 50 entrées par import
- Nécessitera environ 60 imports pour 3000 questions

### 4. ACF to REST API (Gratuit)

**Installation :**
- Extensions → Ajouter
- Rechercher "ACF to REST API"
- Installer + Activer

**Vérification :**
- Visiter : `https://admin.votresite.com/wp-json/wp/v2/quiz`
- Vérifier que les champs ACF apparaissent dans la réponse JSON

## 🔧 Configuration CORS

Pour permettre à Next.js d'accéder à l'API WordPress, ajoutez ce code dans le fichier `functions.php` de votre thème :

**Localisation :** `/public_html/admin/wp-content/themes/votre-theme/functions.php`

```php
// Autoriser CORS pour l'API REST
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://www.votresite.com');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        return $value;
    });
}, 15);
```

**Important :** Remplacez `https://www.votresite.com` par votre vrai domaine Next.js.

## 📝 Endpoints API Disponibles

Après configuration, ces endpoints seront disponibles :

- `GET /wp-json/wp/v2/quiz` - Liste tous les quiz
- `GET /wp-json/wp/v2/quiz/{id}` - Détails d'un quiz
- `GET /wp-json/wp/v2/question` - Liste toutes les questions
- `GET /wp-json/wp/v2/categories` - Liste toutes les catégories

## ✅ Checklist de Configuration

- [ ] Custom Post Type UI installé et configuré
- [ ] Types de contenu "Quiz" et "Question" créés
- [ ] Advanced Custom Fields Pro installé
- [ ] Groupes de champs ACF créés pour Quiz
- [ ] WP All Import Pro installé (ou version gratuite)
- [ ] ACF to REST API installé et activé
- [ ] CORS configuré dans functions.php
- [ ] Test de l'API : `https://admin.votresite.com/wp-json/wp/v2/quiz`
- [ ] Vérification que les champs ACF apparaissent dans l'API

## 🚀 Prochaines Étapes

1. Créer quelques quiz de test dans WordPress
2. Vérifier qu'ils apparaissent dans l'API
3. Configurer les variables d'environnement dans Next.js
4. Tester la connexion entre Next.js et WordPress

