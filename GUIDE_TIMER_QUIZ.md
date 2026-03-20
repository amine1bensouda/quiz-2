# ⏱️ Guide - Timer pour les Quiz

## 🎯 Fonctionnalité

Un **timer global** a été ajouté aux quiz. Quand le temps est écoulé, le quiz se ferme automatiquement et affiche les résultats.

## ✨ Fonctionnalités

### 1. Timer Global du Quiz

- **Durée** : Basée sur `duree_estimee` (en minutes) défini dans les paramètres du quiz
- **Affichage** : Format MM:SS (ex: 10:00, 0:45)
- **Couleurs** :
  - 🔵 **Bleu** : Plus de 3 minutes restantes
  - 🟠 **Orange** : Entre 1 et 3 minutes restantes
  - 🔴 **Rouge** : Moins d'1 minute restante (avec animation pulse)

### 2. Alerte Visuelle

Quand il reste **moins d'1 minute** :
- Une alerte rouge apparaît en haut de la page
- Le timer devient rouge et pulse
- Message : "⚠️ Attention ! Il reste moins d'une minute !"

### 3. Fermeture Automatique

Quand le temps est écoulé :
- Le quiz se ferme automatiquement
- Les résultats sont calculés avec les réponses données jusqu'à présent
- Un message apparaît dans les résultats : "Le temps est écoulé ! Le quiz a été fermé automatiquement."

### 4. Timer par Question (Existant)

Le timer par question continue de fonctionner comme avant :
- Si une question a un `temps_limite`, un timer séparé s'affiche
- Ce timer est indépendant du timer global du quiz

## 📋 Configuration

### Dans l'Interface Admin

1. Allez sur `/admin/quizzes`
2. Éditez un quiz
3. Dans "Durée estimée", vous avez deux options :
   - **Avec timer** : Définissez la durée en **minutes** (ex: `10` pour 10 minutes)
   - **Sans limite de temps** : Laissez le champ **vide** ou mettez `0`
4. Sauvegardez

### Exemple avec Timer

- **Durée estimée** : `10` minutes
- Le timer affichera : `10:00` au début
- Après 1 minute : `9:00`
- Après 9 minutes : `1:00` (devient orange)
- Après 9 minutes 30 secondes : `0:30` (devient rouge)
- À `0:00` : Le quiz se ferme automatiquement

### Exemple sans Limite de Temps

- **Durée estimée** : Laissez **vide** ou mettez `0`
- Un indicateur "Sans limite de temps" s'affichera à la place du timer
- Le quiz fonctionne normalement sans fermeture automatique
- L'utilisateur peut prendre tout le temps nécessaire pour répondre

## 🎨 Affichage

### Barre de Progression

Le timer global s'affiche dans la barre de progression en haut du quiz :

```
┌─────────────────────────────────────────┐
│ [1] Question 1 of 13                     │
│     12 remaining                         │
│                                          │
│     [⏱️ 9:45 Quiz Timer]  [85% Progress] │
└─────────────────────────────────────────┘
```

### Alerte Temps Restant

Quand il reste moins d'1 minute :

```
┌─────────────────────────────────────────┐
│ ⚠️ Attention ! Il reste moins d'une     │
│    minute ! Le quiz se fermera          │
│    automatiquement lorsque le temps      │
│    sera écoulé.                          │
└─────────────────────────────────────────┘
```

## 🔧 Code Technique

### Composant Principal

- **Fichier** : `src/components/Quiz/QuizPlayer.tsx`
- **État** : `quizTimeRemaining` (en secondes)
- **Initialisation** : Convertit `duree_estimee` (minutes) en secondes
- **Timer** : `setInterval` qui décrémente chaque seconde

### Calcul des Résultats

Quand le temps est écoulé :
- `calculateResults()` est appelé automatiquement
- Les réponses non répondues sont marquées comme incorrectes
- Le champ `timeExpired: true` est ajouté aux résultats

### Affichage des Résultats

- **Fichier** : `src/components/Quiz/Results.tsx`
- Affiche un message si `results.timeExpired === true`

## ⚠️ Notes Importantes

1. **Pas de pause** : Le timer continue même si l'utilisateur change de page (si timer activé)
2. **Pas de sauvegarde** : Le timer n'est pas sauvegardé dans localStorage
3. **Réinitialisation** : Si l'utilisateur recharge la page, le timer recommence depuis le début (si timer activé)
4. **Compatibilité** : Fonctionne avec les quiz existants
5. **Mode sans limite** : Si `duree_estimee` est vide, null ou 0, le quiz fonctionne sans timer et sans limite de temps
6. **Indicateur visuel** : Les quiz sans limite affichent "Sans limite de temps" au lieu du timer

## 🚀 Améliorations Futures Possibles

- [ ] Sauvegarder le temps restant dans localStorage
- [ ] Option pour mettre en pause le timer
- [ ] Notification sonore quand il reste 30 secondes
- [ ] Afficher le temps écoulé dans les statistiques
- [ ] Mode "pratique" sans timer

## 📝 Exemples d'Utilisation

### Quiz avec Timer (15 minutes)

```typescript
// Dans quiz-service.ts ou wordpress.ts
const quiz = {
  acf: {
    duree_estimee: 15, // 15 minutes
    // ... autres champs
  }
};
```

Le timer affichera `15:00` au début et fermera automatiquement le quiz après 15 minutes.

### Quiz sans Limite de Temps

```typescript
// Dans quiz-service.ts ou wordpress.ts
const quiz = {
  acf: {
    duree_estimee: null, // ou 0, ou undefined, ou ne pas inclure le champ
    // ... autres champs
  }
};
```

Un indicateur "Sans limite de temps" s'affichera et le quiz ne se fermera pas automatiquement.
