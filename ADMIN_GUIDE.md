# 📘 Guide d'Utilisation de l'Interface Admin

Ce guide explique comment utiliser l'interface d'administration pour gérer les quiz.

## 🔐 Connexion

1. Accédez à `/admin/login`
2. Entrez le mot de passe administrateur (défini dans `ADMIN_PASSWORD` dans `.env.local`)
3. Par défaut : `admin123` (⚠️ Changez-le en production !)

## 📊 Tableau de Bord

Le tableau de bord (`/admin`) affiche :
- **Statistiques** : Nombre total de quiz, questions, et modules
- **Quiz récents** : Les 5 derniers quiz créés
- **Actions rapides** : Liens pour créer un nouveau quiz

## 📝 Gestion des Quiz

### Liste des Quiz (`/admin/quizzes`)

Affiche tous les quiz avec :
- Titre et description
- Slug (identifiant unique)
- Nombre de questions
- Difficulté
- Actions : Modifier / Supprimer

### Créer un Nouveau Quiz (`/admin/quizzes/new`)

1. Cliquez sur "➕ Nouveau Quiz"
2. Remplissez le formulaire :

#### Informations de Base
- **Titre** * : Nom du quiz (ex: "Algèbre de base")
- **Slug** * : Identifiant unique (généré automatiquement depuis le titre)
- **Module** : Sélectionnez un module (optionnel)
- **Description** : Description détaillée du quiz
- **Résumé** : Résumé court affiché dans les listes

#### Paramètres
- **Durée** : Temps alloué en minutes
- **Difficulté** : Facile, Moyen, Difficile, Expert
- **Note de passage** : Pourcentage minimum pour réussir (ex: 70%)
- **Questions max** : Nombre maximum de questions à afficher (laisser vide pour toutes)
- **URL Image** : Image de couverture du quiz
- **Ordre aléatoire** : Mélanger l'ordre des questions

#### Questions

Pour chaque question :
- **Type** : Choix multiple ou Vrai/Faux
- **Points** : Nombre de points attribués
- **Temps limite** : Temps maximum pour répondre (optionnel)
- **Texte de la question** * : Le texte de la question
- **Réponses** * : Au moins 2 réponses
  - Cochez la case pour marquer une réponse comme correcte
  - Ajoutez une explication pour chaque réponse (optionnel)
- **Explication générale** : Explication affichée après la réponse

### Modifier un Quiz (`/admin/quizzes/[id]/edit`)

1. Cliquez sur "Modifier" dans la liste des quiz
2. Modifiez les champs souhaités
3. Cliquez sur "Mettre à jour"

⚠️ **Note** : La modification d'un quiz supprime toutes les questions existantes et les remplace par les nouvelles. Assurez-vous de bien remplir toutes les questions avant de sauvegarder.

### Supprimer un Quiz

1. Cliquez sur "Supprimer" dans la liste des quiz
2. Confirmez la suppression

⚠️ **Attention** : Cette action est irréversible ! Toutes les questions et réponses associées seront également supprimées.

## 🎯 Bonnes Pratiques

### Création de Quiz

1. **Titres clairs** : Utilisez des titres descriptifs
2. **Slugs uniques** : Vérifiez que le slug n'existe pas déjà
3. **Questions complètes** : Assurez-vous que chaque question a :
   - Au moins 2 réponses
   - Au moins une réponse correcte
   - Un texte de question clair
4. **Explications** : Ajoutez des explications pour aider les étudiants

### Gestion des Réponses

- **Choix multiple** : Marquez toutes les bonnes réponses
- **Vrai/Faux** : Créez 2 réponses : "Vrai" et "Faux"
- **Ordre** : L'ordre des réponses peut être important pour l'affichage

### Modules

Les quiz peuvent être organisés par modules. Pour créer des modules :
1. Utilisez Prisma Studio ou l'API directement
2. Ou créez-les via le script de migration

## 🔧 Dépannage

### Erreur "Unauthorized"
- Vérifiez que vous êtes connecté
- Reconnectez-vous si nécessaire

### Erreur "Slug already exists"
- Choisissez un slug différent
- Le slug doit être unique

### Questions non sauvegardées
- Vérifiez que chaque question a au moins 2 réponses
- Vérifiez que le texte de la question n'est pas vide

## 📚 Structure des Données

### Quiz
- `id` : Identifiant unique
- `title` : Titre du quiz
- `slug` : Identifiant URL-friendly
- `moduleId` : Module associé (optionnel)
- `duration` : Durée en minutes
- `difficulty` : Niveau de difficulté
- `passingGrade` : Note de passage (%)
- `randomizeOrder` : Mélanger les questions
- `maxQuestions` : Nombre max de questions

### Question
- `id` : Identifiant unique
- `text` : Texte de la question
- `type` : Type (multiple_choice, true_false)
- `points` : Points attribués
- `explanation` : Explication générale
- `timeLimit` : Temps limite (secondes)
- `order` : Ordre d'affichage

### Answer
- `id` : Identifiant unique
- `text` : Texte de la réponse
- `isCorrect` : Est-ce la bonne réponse ?
- `explanation` : Explication de la réponse
- `order` : Ordre d'affichage

## 🚀 Prochaines Étapes

- Gestion des modules depuis l'interface
- Import/Export de quiz
- Statistiques détaillées
- Gestion des utilisateurs
