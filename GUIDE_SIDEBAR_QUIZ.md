# Guide : Sidebar de Navigation des Questions

## 📋 Fonctionnalités Ajoutées

### 1. **Sidebar de Navigation**
Une sidebar a été ajoutée pour afficher toutes les questions du quiz et permettre une navigation rapide entre elles.

### 2. **Passer une Question Sans Réponse**
Il est maintenant possible de passer une question sans sélectionner de réponse. Le bouton "Next" reste toujours actif.

### 3. **Navigation Libre**
Vous pouvez naviguer librement entre les questions via la sidebar, même après avoir répondu à certaines questions.

## 🎯 Comment Utiliser

### Ouvrir/Fermer la Sidebar

1. **Bouton Toggle** : Cliquez sur le bouton avec l'icône de menu (☰) en haut à droite de la page du quiz
2. **Sur Mobile** : La sidebar s'ouvre en overlay et se ferme automatiquement après sélection d'une question
3. **Sur Desktop** : La sidebar s'ouvre à droite et le contenu principal s'ajuste automatiquement

### Navigation Entre les Questions

1. **Via la Sidebar** :
   - Cliquez sur n'importe quelle question dans la liste pour y accéder directement
   - Les questions sont numérotées de 1 à N
   - La question actuelle est mise en évidence en bleu

2. **Via les Boutons** :
   - **Previous** : Retourner à la question précédente
   - **Next/Skip** : Passer à la question suivante (même sans réponse)

### États des Questions dans la Sidebar

- **🟢 Vert** : Question répondue (avec une coche ✓)
- **🔵 Bleu** : Question actuelle (avec un indicateur pulsant)
- **⚪ Gris** : Question non répondue

### Statistiques

En haut de la sidebar, vous pouvez voir :
- Nombre de questions répondues
- Nombre de questions non répondues

## 💡 Fonctionnalités Détaillées

### Passer une Question

- Le bouton "Next" affiche :
  - **"Next Question"** si une réponse est sélectionnée
  - **"Skip Question"** si aucune réponse n'est sélectionnée
- Sur la dernière question :
  - **"Finish Quiz"** si une réponse est sélectionnée
  - **"Finish Quiz (Skip)"** si aucune réponse n'est sélectionnée

### Sauvegarde Automatique

- Votre progression est automatiquement sauvegardée dans le navigateur
- Vous pouvez fermer et rouvrir le quiz sans perdre vos réponses
- Les questions non répondues peuvent être complétées plus tard

### Calcul des Résultats

- Les questions sans réponse sont comptées comme **incorrectes**
- Le message "Aucune réponse" apparaît dans les résultats détaillés
- Vous pouvez toujours voir la bonne réponse même si vous n'avez pas répondu

## 🎨 Design

- **Sidebar** : Largeur de 320px (w-80), avec bordure et ombre
- **Bouton Toggle** : Position fixe en haut à droite, avec animation au survol
- **Questions** : Cartes cliquables avec états visuels distincts
- **Responsive** : S'adapte automatiquement aux écrans mobiles et desktop

## 🔧 Fichiers Modifiés

- `src/components/Quiz/QuizPlayer.tsx` : Intégration de la sidebar et modification du bouton Next
- `src/components/Quiz/QuizSidebar.tsx` : Nouveau composant pour la sidebar

## 📝 Notes Techniques

- La sidebar utilise `position: fixed` pour rester visible lors du scroll
- Le contenu principal s'ajuste avec `lg:mr-80` quand la sidebar est ouverte sur desktop
- Sur mobile, un overlay sombre apparaît pour fermer la sidebar
- Les états des questions sont calculés en temps réel à partir de `selectedAnswers`

## ✅ Avantages

1. **Navigation Rapide** : Accès direct à n'importe quelle question
2. **Flexibilité** : Possibilité de passer des questions et y revenir plus tard
3. **Visibilité** : Vue d'ensemble de toutes les questions et de leur statut
4. **Expérience Utilisateur** : Interface intuitive et moderne
