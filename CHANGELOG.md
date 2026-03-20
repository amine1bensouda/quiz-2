# Changelog

## [Dernière version] - 2024

### ✨ Nouvelles fonctionnalités

- **Migration vers Prisma ORM** : Remplacement de la base de données SQLite par PostgreSQL avec Prisma
- **Panel d'administration complet** : Interface pour gérer les cours, modules et quiz
- **Système de quiz avancé** :
  - Timer persistant qui survit aux rafraîchissements de page
  - Système de flagging pour marquer les questions
  - Page de correction dédiée avec sidebar de navigation
- **Types de questions multiples** :
  - Questions à choix multiples (QCM)
  - Vrai/Faux
  - Réponse libre (texte)
- **Rendu mathématique** :
  - Support LaTeX avec KaTeX (par défaut)
  - Support MathJax (optionnel) pour un meilleur support LaTeX
  - Formules inline (`$...$`) et en bloc (`$$...$$`)
- **Éditeur WYSIWYG** : Éditeur riche (React Quill) pour les descriptions et questions
- **Traduction complète** : Site entièrement traduit en anglais (y compris le panel admin)
- **Affichage dynamique des cours** : Les cours publiés sont affichés dynamiquement sur la page d'accueil

### 🔧 Améliorations

- **Sidebar de quiz** : Affichage amélioré avec rendu LaTeX correct
- **Champs optionnels** : Durée, difficulté, note de passage et nombre max de questions sont maintenant optionnels
- **Meilleure gestion des erreurs** : Messages d'erreur améliorés et gestion des cas limites
- **Performance** : Optimisations du rendu et de la gestion d'état

### 🐛 Corrections de bugs

- Correction de l'affichage des formules LaTeX dans les sidebars
- Correction de l'erreur d'hydratation React (div dans p)
- Correction du calcul des résultats pour les questions à réponse libre
- Amélioration de la détection et du rendu des formules mathématiques

### 📝 Documentation

- Ajout de `DEPLOYMENT.md` : Guide complet de déploiement sur Vercel
- Ajout de `MATHJAX_USAGE.md` : Guide d'utilisation de LaTeX/MathJax
- Mise à jour du `README.md` avec les nouvelles fonctionnalités
- Ajout de scripts de vérification pour les quiz et questions

### 🔒 Sécurité

- Hashage des mots de passe admin avec bcrypt
- Protection des routes d'administration
- Validation des données côté serveur
