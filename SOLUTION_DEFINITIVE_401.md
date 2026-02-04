# 🔧 Solution Définitive - Erreur 401

## ❌ Problème Persistant

L'erreur 401 persiste même après les corrections du plugin. Cela indique que WordPress bloque toujours l'accès.

## ✅ Solution Complète

### Étape 1 : Mettre à jour le Plugin

Le plugin a été mis à jour avec une version plus robuste (v1.1.0) qui :
- Force l'accès public via `rest_authentication_errors`
- Utilise des requêtes directes à la base de données
- Contourne les restrictions de permissions

**Action** : Réactivez le plugin dans WordPress.

### Étape 2 : Ajouter du Code dans functions.php

**IMPORTANT** : Ajoutez ce code dans le fichier `functions.php` de votre thème WordPress.

**Localisation** : `C:\xampp\htdocs\test2\wp-content\themes\twentytwentyfive\functions.php`

**OU** : Un fichier séparé a été créé : `functions-tutor-api.php` que vous pouvez inclure.

#### Option A : Ajouter directement dans functions.php

Ouvrez `functions.php` et ajoutez à la fin :

```php
// ============================================
// Tutor LMS REST API - Accès Public
// ============================================

// Forcer l'accès REST API pour tutor_quiz
add_filter('register_post_type_args', function($args, $post_type) {
    if ($post_type === 'tutor_quiz') {
        $args['show_in_rest'] = true;
        $args['public'] = true;
        $args['publicly_queryable'] = true;
        $args['rest_base'] = 'tutor_quiz';
    }
    return $args;
}, 99, 2);

// Autoriser l'accès public aux endpoints tutor/v1
add_filter('rest_authentication_errors', function($result) {
    // Si déjà authentifié, pas de problème
    if (!empty($result)) {
        return $result;
    }
    
    // Autoriser l'accès public aux endpoints tutor/v1
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/wp-json/tutor/v1/') !== false) {
        return true;
    }
    
    return $result;
}, 99);
```

#### Option B : Utiliser le fichier séparé

Si le fichier `functions-tutor-api.php` existe dans votre thème, ajoutez dans `functions.php` :

```php
require_once get_template_directory() . '/functions-tutor-api.php';
```

### Étape 3 : Réinitialiser les Permaliens

**CRUCIAL** : Après avoir ajouté le code :

1. Allez dans : **Réglages** → **Permaliens**
2. **Sans rien modifier**, cliquez sur **"Enregistrer les modifications"**

### Étape 4 : Vider le Cache (si vous avez un plugin de cache)

Si vous utilisez un plugin de cache (WP Super Cache, W3 Total Cache, etc.) :
1. Videz le cache
2. Ou désactivez temporairement le plugin de cache

### Étape 5 : Tester

Testez dans votre navigateur :

```
http://localhost/test2/wp-json/tutor/v1/quizzes
```

**Résultat attendu** : Une réponse JSON (même si vide `[]`)

## 🔍 Vérifications Supplémentaires

### Vérifier que le code est bien chargé

Ajoutez temporairement ce code dans `functions.php` pour vérifier :

```php
add_action('init', function() {
    error_log('Tutor LMS REST API - Code chargé');
    $post_type = get_post_type_object('tutor_quiz');
    if ($post_type) {
        error_log('tutor_quiz show_in_rest: ' . ($post_type->show_in_rest ? 'true' : 'false'));
    }
}, 999);
```

Puis vérifiez `wp-content/debug.log` (activez WP_DEBUG d'abord).

### Vérifier les Plugins de Sécurité

Certains plugins peuvent bloquer :
- **Wordfence** : Vérifiez les paramètres de sécurité
- **iThemes Security** : Vérifiez les restrictions REST API
- **All In One WP Security** : Vérifiez les paramètres

**Solution temporaire** : Désactivez-les pour tester.

### Vérifier .htaccess

Vérifiez que `.htaccess` n'a pas de règles qui bloquent `/wp-json/`.

## 🚨 Si Rien Ne Fonctionne

### Solution Alternative : Utiliser l'API WordPress Standard

Si Tutor LMS expose ses quiz via le CPT standard, essayez :

```
http://localhost/test2/wp-json/wp/v2/tutor_quiz
```

Si cela fonctionne, on peut adapter le code Next.js pour utiliser cet endpoint.

### Activer le Mode Debug

Dans `wp-config.php` :

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Puis vérifiez `wp-content/debug.log` pour voir les erreurs exactes.

## ✅ Checklist Finale

- [ ] Plugin Tutor LMS REST API activé (v1.1.0)
- [ ] Code ajouté dans `functions.php`
- [ ] Permaliens réinitialisés
- [ ] Cache vidé (si applicable)
- [ ] Plugins de sécurité vérifiés
- [ ] Endpoint testé : `http://localhost/test2/wp-json/tutor/v1/quizzes`
- [ ] Réponse JSON obtenue (pas d'erreur 401)

## 📞 Support

Si l'erreur persiste après toutes ces étapes, vérifiez :
1. Les logs WordPress (`wp-content/debug.log`)
2. Les logs Apache/PHP
3. La console du navigateur (F12) pour les erreurs CORS



