# 🎯 Guide Rapide - Création des Champs ACF

Guide simplifié pour créer rapidement les champs dans WordPress.

## ⚡ Version Rapide (10 minutes)

### 1. Accéder à ACF

**ACF** → **Field Groups** → **Add New**

### 2. Informations de Base

- **Titre** : `Quiz Details`
- **Location** : Post Type is equal to Quiz

### 3. Ajouter les 6 Champs Simples (dans l'ordre)

Cliquer **"Add Field"** pour chaque :

| # | Label | Name | Type | Default | Required |
|---|-------|------|------|---------|----------|
| 1 | Durée estimée | `duree_estimee` | Number | 10 | ✅ |
| 2 | Niveau de difficulté | `niveau_difficulte` | Select | Moyen | ✅ |
| 3 | Catégorie | `categorie` | Text | - | ✅ |
| 4 | Nombre de questions | `nombre_questions` | Number | - | ✅ |
| 5 | Score minimum | `score_minimum` | Number | 70 | ✅ |
| 6 | Ordre des questions | `ordre_questions` | Select | Fixe | ✅ |

**Pour les Select** :
- **Niveau** : Facile, Moyen, Difficile, Expert
- **Ordre** : Fixe, Aleatoire

### 4. Ajouter le Repeater "Questions"

- **Label** : `Questions`
- **Name** : `questions`
- **Type** : `Repeater`
- **Layout** : `Block`
- **Required** : ✅ Oui

### 5. Dans le Repeater "Questions", ajouter 7 sous-champs

Cliquer sur "Questions" → **Add Sub Field** :

| Label | Name | Type | Required |
|-------|------|------|----------|
| Texte de la question | `texte_question` | Textarea | ✅ |
| Type de question | `type_question` | Select | ✅ |
| Image | `media` | Image | ❌ |
| Explication | `explication` | Textarea | ❌ |
| Points | `points` | Number | ❌ |
| Temps recommandé | `temps_limite` | Number | ❌ |
| Réponses | `reponses` | Repeater | ✅ |

**Type de question (Select)** :
- QCM
- VraiFaux
- TexteLibre
- Image

### 6. Dans le Repeater "Réponses", ajouter 3 sous-champs

Cliquer sur "Réponses" → **Add Sub Field** :

| Label | Name | Type | Required |
|-------|------|------|----------|
| Texte de la réponse | `texte` | Text | ✅ |
| Réponse correcte | `correcte` | True/False | ✅ |
| Explication | `explication` | Textarea | ❌ |

### 7. Configuration REST API

En bas de la page, section **Settings** :
- ✅ **Show in REST API** : Oui

### 8. Publier

Cliquer **"Publish"**

---

## ✅ Vérification

1. Créer un quiz de test
2. Vérifier que tous les champs apparaissent
3. Tester : `http://localhost/quiz-wordpress/wp-json/wp/v2/quiz`

---

## 📸 Structure Visuelle

```
Quiz Details
├── Durée estimée (Number)
├── Niveau de difficulté (Select)
├── Catégorie (Text)
├── Nombre de questions (Number)
├── Score minimum (Number)
├── Ordre des questions (Select)
└── Questions (Repeater)
    ├── Texte de la question (Textarea)
    ├── Type de question (Select)
    ├── Image (Image) [optionnel]
    ├── Explication (Textarea) [optionnel]
    ├── Points (Number) [optionnel]
    ├── Temps recommandé (Number) [optionnel]
    └── Réponses (Repeater)
        ├── Texte (Text)
        ├── Correcte (True/False)
        └── Explication (Textarea) [optionnel]
```

---

## 🎯 Exemple de Quiz Complet

### Quiz : "Histoire de France - Niveau Débutant"

**Champs de base** :
- Durée : 15 minutes
- Difficulté : Facile
- Catégorie : Histoire
- Questions : 5
- Score min : 60%
- Ordre : Fixe

**Question 1** :
- Texte : "Quelle est la capitale de la France ?"
- Type : QCM
- Réponses :
  - Paris → ✅ Correcte
  - Lyon → ❌
  - Marseille → ❌
  - Bordeaux → ❌
- Explication : "Paris est la capitale depuis le Moyen Âge."

**Question 2** :
- Texte : "En quelle année a eu lieu la Révolution française ?"
- Type : QCM
- Réponses :
  - 1789 → ✅
  - 1792 → ❌
  - 1815 → ❌

Et ainsi de suite...

---

**Besoin d'aide détaillée ?** Consultez `CONFIGURATION_ACF_COMPLETE.md`




