# 🚀 Activer le Plugin ACF Quiz Fields

Le plugin a été créé avec tous les champs ACF en code. Voici comment l'activer.

## 📍 Localisation du Plugin

Le plugin se trouve dans :
```
C:\xampp\htdocs\quiz-wordpress\wp-content\plugins\acf-quiz-fields\acf-quiz-fields.php
```

## ✅ Étapes pour Activer

### 1. Accéder à WordPress

Ouvrez : **http://localhost/quiz-wordpress/wp-admin**

### 2. Aller dans les Extensions

Dans le menu de gauche → **Extensions** → **Extensions installées**

### 3. Activer le Plugin

1. Cherchez **"ACF Quiz Fields"** dans la liste
2. Cliquez sur **"Activer"** sous le nom du plugin

### 4. Vérifier l'Activation

✅ Le plugin devrait apparaître dans la liste des extensions activées

### 5. Vérifier les Champs ACF

1. Allez dans **ACF** → **Field Groups**
2. Vous devriez voir **2 groupes** créés automatiquement :
   - ✅ **Quiz Details** (pour les Quiz)
   - ✅ **Question Details** (pour les Questions)

### 6. Vérifier les Settings REST API

1. Cliquez sur **"Quiz Details"**
2. En bas, section **Settings**
3. Vérifiez que **"Show in REST API"** est sur **"Yes"** ✅

Si ce n'est pas le cas, modifiez et sauvegardez.

## 🎯 Test Rapide

1. **Quiz** → **Ajouter**
2. Vérifiez que tous les champs ACF apparaissent :
   - Durée estimée
   - Niveau de difficulté
   - Catégorie
   - Nombre de questions
   - Score minimum
   - Ordre des questions
   - **Questions** (Repeater)

3. Cliquez sur **"Ajouter une question"** dans le Repeater
4. Vérifiez que les sous-champs apparaissent :
   - Texte de la question
   - Type de question
   - Image
   - Explication
   - Points
   - Temps recommandé
   - **Réponses** (Repeater)

5. Dans "Réponses", cliquez **"Ajouter une réponse"**
6. Vérifiez les champs :
   - Texte de la réponse
   - Réponse correcte (checkbox)
   - Explication

## ✅ Si Tout Fonctionne

Tous les champs sont créés automatiquement ! Vous pouvez maintenant :
- Créer des quiz avec tous les champs
- Ajouter des questions avec réponses
- Tout sera disponible dans l'API REST

## ⚠️ En Cas d'Erreur

### Erreur "ACF Pro requis"

Le plugin nécessite **Advanced Custom Fields Pro**. 

**Solution** :
1. Acheter ACF Pro sur https://www.advancedcustomfields.com/pro/
2. Installer et activer ACF Pro
3. Réactiver "ACF Quiz Fields"

### Les champs n'apparaissent pas

**Vérifications** :
1. Le plugin est activé ?
2. ACF Pro est installé et activé ?
3. Les Custom Post Types "Quiz" et "Question" sont créés ?
4. Rafraîchir la page (F5)

### Les champs n'apparaissent pas dans l'API

**Solution** :
1. ACF → Field Groups → Quiz Details
2. Settings → Show in REST API → **Yes**
3. Sauvegarder
4. Tester : `http://localhost/quiz-wordpress/wp-json/wp/v2/quiz`

---

## 🎉 C'est Fait !

Une fois activé, tous les champs sont prêts à l'emploi. Vous n'avez plus qu'à créer vos quiz !




