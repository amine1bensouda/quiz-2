# 🔧 Guide de Correction - Questions Sans Réponses

## 📊 Problème Identifié

**1864 questions** dans votre base de données n'ont pas de réponses associées. C'est pourquoi vous voyez le message "No answers available for this question."

## ✅ Solutions

### Option 1 : Correction via l'Interface Admin (Recommandé)

1. **Accédez à l'interface admin** :
   ```
   http://localhost:3000/admin/quizzes
   ```

2. **Pour chaque quiz** :
   - Cliquez sur "Éditer" pour le quiz concerné
   - Vérifiez chaque question
   - Pour les questions sans réponses, ajoutez au moins 2 réponses :
     - Une réponse correcte (cochez "Correct")
     - Une ou plusieurs réponses incorrectes
   - Sauvegardez le quiz

### Option 2 : Vérification via Prisma Studio

1. **Ouvrez Prisma Studio** :
   ```bash
   npx prisma studio
   ```

2. **Naviguez vers les Questions** :
   - Cliquez sur "Question" dans le menu de gauche
   - Filtrez pour trouver les questions sans réponses
   - Pour chaque question :
     - Cliquez sur la question
     - Vérifiez la section "answers"
     - Si vide, ajoutez des réponses via l'interface admin

### Option 3 : Script de Correction Automatique (Avancé)

Si vous avez les réponses dans une autre source (WordPress, fichier CSV, etc.), je peux créer un script pour les importer automatiquement.

## 🔍 Comment Identifier les Questions Problématiques

Le script de diagnostic (`scripts/check-questions-without-answers.ts`) liste toutes les questions sans réponses. Vous pouvez le relancer à tout moment :

```bash
npx tsx scripts/check-questions-without-answers.ts
```

## 📝 Exemple de Question Correcte

Une question doit avoir au minimum :
- **Texte de la question** : "Determine the prime factorization of 3564."
- **Réponses** :
  - Réponse A : "2² × 3⁴ × 11" (✓ Correcte)
  - Réponse B : "2 × 3² × 11" (Incorrecte)
  - Réponse C : "2³ × 3³ × 11" (Incorrecte)
  - Réponse D : "2² × 3² × 11²" (Incorrecte)

## ⚠️ Important

- **Toutes les questions doivent avoir au moins 2 réponses**
- **Au moins une réponse doit être marquée comme correcte**
- **Les réponses doivent être triées par ordre (order field)**

## 🚀 Après Correction

Une fois que vous avez ajouté les réponses manquantes :
1. Les quiz devraient fonctionner correctement
2. Le message "No answers available" ne devrait plus apparaître
3. Les utilisateurs pourront répondre aux questions

## 💡 Astuce

Pour accélérer la correction :
1. Commencez par les quiz les plus utilisés
2. Utilisez Prisma Studio pour voir rapidement quelles questions manquent de réponses
3. Ajoutez les réponses par lots si possible
