# 📋 Configuration Complète ACF - Quiz et Questions

Guide détaillé pour créer tous les champs Advanced Custom Fields nécessaires.

## 🎯 Structure des Champs

### Groupe 1 : Quiz Details (Pour les Quiz)

### Groupe 2 : Question Details (Pour les Questions)

---

## 📝 Groupe 1 : Quiz Details

**Localisation** : Post Type is equal to Quiz

### Champs de Base

#### 1. Durée estimée
- **Field Label** : `Durée estimée`
- **Field Name** : `duree_estimee`
- **Field Type** : `Number`
- **Default Value** : `10`
- **Required** : ✅ Oui
- **Instructions** : Durée en minutes

#### 2. Niveau de difficulté
- **Field Label** : `Niveau de difficulté`
- **Field Name** : `niveau_difficulte`
- **Field Type** : `Select`
- **Choices** :
  ```
  Facile : Facile
  Moyen : Moyen
  Difficile : Difficile
  Expert : Expert
  ```
- **Default Value** : `Moyen`
- **Required** : ✅ Oui

#### 3. Catégorie
- **Field Label** : `Catégorie`
- **Field Name** : `categorie`
- **Field Type** : `Text`
- **Required** : ✅ Oui
- **Instructions** : Ex: Histoire, Géographie, Science

#### 4. Nombre de questions
- **Field Label** : `Nombre de questions`
- **Field Name** : `nombre_questions`
- **Field Type** : `Number`
- **Required** : ✅ Oui
- **Instructions** : Nombre total de questions dans ce quiz

#### 5. Score minimum
- **Field Label** : `Score minimum pour réussir`
- **Field Name** : `score_minimum`
- **Field Type** : `Number`
- **Default Value** : `70`
- **Required** : ✅ Oui
- **Instructions** : Pourcentage minimum pour réussir le quiz (0-100)

#### 6. Ordre des questions
- **Field Label** : `Ordre des questions`
- **Field Name** : `ordre_questions`
- **Field Type** : `Select`
- **Choices** :
  ```
  Fixe : Fixe
  Aleatoire : Aleatoire
  ```
- **Default Value** : `Fixe`
- **Required** : ✅ Oui

### Champs Avancés (Repeater)

#### 7. Questions (Repeater) - ⚠️ Nécessite ACF Pro

- **Field Label** : `Questions`
- **Field Name** : `questions`
- **Field Type** : `Repeater`
- **Layout** : `Block`
- **Button Label** : `Ajouter une question`
- **Required** : ✅ Oui

**Sous-champs du Repeater "Questions"** :

##### a) Texte de la question
- **Field Label** : `Texte de la question`
- **Field Name** : `texte_question`
- **Field Type** : `Textarea`
- **Rows** : `3`
- **Required** : ✅ Oui

##### b) Type de question
- **Field Label** : `Type de question`
- **Field Name** : `type_question`
- **Field Type** : `Select`
- **Choices** :
  ```
  QCM : QCM (Question à Choix Multiple)
  VraiFaux : Vrai/Faux
  TexteLibre : Texte libre
  Image : Question avec image
  ```
- **Default Value** : `QCM`
- **Required** : ✅ Oui

##### c) Image de la question (optionnel)
- **Field Label** : `Image de la question`
- **Field Name** : `media`
- **Field Type** : `Image`
- **Return Format** : `Image URL`
- **Required** : ❌ Non

##### d) Explication générale
- **Field Label** : `Explication de la question`
- **Field Name** : `explication`
- **Field Type** : `Textarea`
- **Rows** : `3`
- **Required** : ❌ Non
- **Instructions** : Explication affichée après la réponse

##### e) Points (optionnel)
- **Field Label** : `Points`
- **Field Name** : `points`
- **Field Type** : `Number`
- **Default Value** : `1`
- **Required** : ❌ Non

##### f) Temps recommandé (optionnel)
- **Field Label** : `Temps recommandé (secondes)`
- **Field Name** : `temps_limite`
- **Field Type** : `Number`
- **Required** : ❌ Non

##### g) Réponses (Repeater) - ⚠️ Nécessite ACF Pro

- **Field Label** : `Réponses`
- **Field Name** : `reponses`
- **Field Type** : `Repeater`
- **Layout** : `Table`
- **Button Label** : `Ajouter une réponse`
- **Min Rows** : `2`
- **Max Rows** : `6`
- **Required** : ✅ Oui

**Sous-champs du Repeater "Réponses"** :

###### i) Texte de la réponse
- **Field Label** : `Texte de la réponse`
- **Field Name** : `texte`
- **Field Type** : `Text`
- **Required** : ✅ Oui

###### ii) Réponse correcte
- **Field Label** : `Réponse correcte`
- **Field Name** : `correcte`
- **Field Type** : `True/False`
- **Default Value** : `0` (False)
- **Required** : ✅ Oui
- **Instructions** : Cocher si cette réponse est correcte

###### iii) Explication de la réponse (optionnel)
- **Field Label** : `Explication`
- **Field Name** : `explication`
- **Field Type** : `Textarea`
- **Rows** : `2`
- **Required** : ❌ Non
- **Instructions** : Explication spécifique à cette réponse

---

## 📝 Groupe 2 : Question Details (Optionnel - Pour Questions Indépendantes)

Si vous voulez créer des questions séparées (pas dans un quiz), créez ce groupe :

**Localisation** : Post Type is equal to Question

### Champs pour Question

#### 1. Type de question
- **Field Label** : `Type de question`
- **Field Name** : `type_question`
- **Field Type** : `Select`
- **Choices** : (même que ci-dessus)

#### 2. Image
- **Field Label** : `Image`
- **Field Name** : `media`
- **Field Type** : `Image`

#### 3. Explication
- **Field Label** : `Explication`
- **Field Name** : `explication`
- **Field Type** : `Textarea`

#### 4. Points
- **Field Label** : `Points`
- **Field Name** : `points`
- **Field Type** : `Number`

#### 5. Réponses (Repeater)
- Même structure que ci-dessus

---

## 🔧 Instructions de Configuration dans WordPress

### Étape 1 : Créer le Groupe "Quiz Details"

1. **ACF** → **Field Groups** → **Add New**

2. **Titre** : `Quiz Details`

3. **Location Rules** :
   - Cliquer **"Add rule group"**
   - **Post Type** → **is equal to** → **Quiz**

4. **Ajouter les champs** un par un (cliquer "Add Field")

5. **Settings** (en bas) :
   - ✅ **Show in REST API** : Oui (CRUCIAL !)
   - Position : Normal (after content)

6. **Publish**

### Étape 2 : Ordre des Champs

Organisez les champs dans cet ordre :

1. Durée estimée
2. Niveau de difficulté
3. Catégorie
4. Nombre de questions
5. Score minimum
6. Ordre des questions
7. Questions (Repeater)
   - Texte de la question
   - Type de question
   - Image (optionnel)
   - Explication
   - Points (optionnel)
   - Temps recommandé (optionnel)
   - Réponses (Repeater)
     - Texte
     - Correcte
     - Explication (optionnel)

### Étape 3 : Configuration du Repeater "Questions"

1. Cliquer sur le champ **"Questions"** (Repeater)

2. Dans **"Sub Fields"**, ajouter les sous-champs dans l'ordre

3. Pour le sous-champ **"Réponses"** (qui est aussi un Repeater) :
   - Cliquer dessus
   - Ajouter ses propres sous-champs (texte, correcte, explication)

### Étape 4 : Vérification

1. Créer un quiz de test
2. Vérifier que tous les champs apparaissent
3. Tester l'API : `http://localhost/quiz-wordpress/wp-json/wp/v2/quiz`
4. Vérifier que les champs ACF sont présents dans le JSON

---

## 📋 Checklist de Vérification

- [ ] Groupe "Quiz Details" créé
- [ ] Location : Post Type = Quiz
- [ ] Tous les champs ajoutés
- [ ] Repeater "Questions" configuré
- [ ] Repeater "Réponses" configuré dans "Questions"
- [ ] "Show in REST API" activé
- [ ] Quiz de test créé avec champs remplis
- [ ] API retourne les champs ACF : `/wp-json/wp/v2/quiz`

---

## 🎯 Structure JSON Attendue

Une fois configuré, l'API devrait retourner :

```json
{
  "id": 1,
  "title": {
    "rendered": "Quiz Test"
  },
  "acf": {
    "duree_estimee": 10,
    "niveau_difficulte": "Moyen",
    "categorie": "Histoire",
    "nombre_questions": 3,
    "score_minimum": 70,
    "ordre_questions": "Fixe",
    "questions": [
      {
        "texte_question": "Quelle est la capitale ?",
        "type_question": "QCM",
        "explication": "Explication...",
        "reponses": [
          {
            "texte": "Paris",
            "correcte": true,
            "explication": "Paris est la capitale"
          },
          {
            "texte": "Lyon",
            "correcte": false,
            "explication": ""
          }
        ]
      }
    ]
  }
}
```

---

## 💡 Astuces

1. **Testez au fur et à mesure** : Créez un quiz de test après chaque étape
2. **Vérifiez l'API** : Testez `/wp-json/wp/v2/quiz` régulièrement
3. **Sauvegardez** : Exportez votre configuration ACF (ACF Pro permet l'export)
4. **Ordre important** : Respectez l'ordre des champs pour la clarté

---

**Besoin d'aide ?** Consultez `GUIDE_ETAPE_PAR_ETAPE.md` pour les instructions détaillées.




