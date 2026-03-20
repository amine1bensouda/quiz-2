# 🔧 Correction Erreur 401 - Permissions REST API

## ❌ Problème

Erreur `{"code":"rest_forbidden","message":"Sorry, you are not allowed to do that.","data":{"status":401}}`

Cela signifie que WordPress bloque l'accès aux endpoints REST API pour des raisons de permissions.

## ✅ Solution Appliquée

Le plugin a été mis à jour pour :

1. **Rendre le CPT `tutor_quiz` accessible via REST API**
2. **Autoriser l'accès public** sans authentification
3. **Configurer correctement les permissions**

## 🔄 Actions Requises

### 1. Mettre à jour le Plugin

Le fichier du plugin a été modifié. Si vous l'avez déjà activé :

1. **Désactiver** le plugin : Extensions → Extensions installées → Tutor LMS REST API → Désactiver
2. **Réactiver** le plugin : Cliquer sur Activer

Cela rechargera le code mis à jour.

### 2. Réinitialiser les Permaliens

**Important** : Réinitialisez les permaliens pour que WordPress reconnaisse les nouvelles routes :

1. Allez dans : **Réglages** → **Permaliens**
2. **Sans rien modifier**, cliquez sur **"Enregistrer les modifications"**

### 3. Vérifier les Permissions du CPT

Si l'erreur persiste, vérifiez que le Custom Post Type `tutor_quiz` est bien configuré pour être accessible publiquement.

Ajoutez ce code dans `functions.php` de votre thème (temporairement pour tester) :

```php
// Forcer l'accès REST API pour tutor_quiz
add_filter('register_post_type_args', function($args, $post_type) {
    if ($post_type === 'tutor_quiz') {
        $args['show_in_rest'] = true;
        $args['public'] = true;
        $args['publicly_queryable'] = true;
    }
    return $args;
}, 10, 2);
```

### 4. Vérifier les Plugins de Sécurité

Certains plugins de sécurité (comme Wordfence, iThemes Security) peuvent bloquer l'accès à l'API REST.

**Solution** :
1. Vérifiez les paramètres de votre plugin de sécurité
2. Ajoutez une exception pour `/wp-json/tutor/v1/*`
3. Ou désactivez temporairement le plugin de sécurité pour tester

### 5. Vérifier .htaccess

Si vous utilisez Apache, vérifiez que le fichier `.htaccess` n'a pas de règles qui bloquent l'API REST.

## 🧪 Test

Après avoir effectué ces étapes, testez :

```
http://localhost/test2/wp-json/tutor/v1/quizzes
```

Vous devriez voir une réponse JSON (même si vide `[]`).

## 🔍 Debugging

### Activer le Mode Debug WordPress

Dans `wp-config.php`, ajoutez :

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Puis vérifiez les logs dans `wp-content/debug.log` pour voir les erreurs exactes.

### Vérifier les Routes Enregistrées

Ajoutez ce code temporairement dans `functions.php` :

```php
add_action('rest_api_init', function() {
    $routes = rest_get_server()->get_routes();
    error_log('Routes REST API: ' . print_r(array_keys($routes), true));
}, 999);
```

Puis vérifiez `wp-content/debug.log` pour voir si la route `tutor/v1/quizzes` est bien enregistrée.

## ✅ Vérification Finale

1. ✅ Plugin activé
2. ✅ Permaliens réinitialisés
3. ✅ Pas de plugins de sécurité qui bloquent
4. ✅ Endpoint accessible : `http://localhost/test2/wp-json/tutor/v1/quizzes`

Si tout est OK, vous devriez voir une réponse JSON au lieu de l'erreur 401.



