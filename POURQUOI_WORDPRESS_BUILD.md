# 🔍 Pourquoi WordPress est appelé pendant le build ?

## Problème identifié

Pendant le build (`npm run build`), Next.js génère des pages statiques en appelant certaines fonctions qui tentent de se connecter à WordPress, même si vous utilisez maintenant Prisma/PostgreSQL comme source principale de données.

## Pages concernées

### 1. `src/app/quiz/[slug]/page.tsx`
- **Fonction** : `generateStaticParams()`
- **Appel** : `getAllQuizSlugs()` depuis `wordpress.ts`
- **Problème** : Tente de se connecter à WordPress pour récupérer les slugs

### 2. `src/app/categorie/[slug]/page.tsx`
- **Fonction** : `generateStaticParams()`
- **Appel** : `getAllCategories()` depuis `wordpress.ts`
- **Problème** : Tente de se connecter à WordPress pour récupérer les catégories

### 3. `src/app/page.tsx`
- **Fonction** : `HomePage()` (Server Component)
- **Appel** : `getAllQuiz()` et `getStats()` depuis `wordpress.ts`
- **Problème** : Ces fonctions ont un fallback vers WordPress si Prisma échoue

## Solution appliquée

### ✅ Modifications effectuées

1. **`src/app/quiz/[slug]/page.tsx`**
   - Changé : `getAllQuizSlugs()` utilise maintenant `quiz-service.ts` (Prisma uniquement)
   - Avant : `import { getAllQuizSlugs } from '@/lib/wordpress'`
   - Après : `import { getAllQuizSlugs } from '@/lib/quiz-service'`

2. **`src/app/categorie/[slug]/page.tsx`**
   - Changé : `getAllCategories()` utilise maintenant `quiz-service.ts` (Prisma uniquement)
   - Avant : `import { getAllCategories } from '@/lib/wordpress'`
   - Après : `import { getAllCategories } from '@/lib/quiz-service'`

3. **`src/app/page.tsx`**
   - Changé : `getAllQuiz()` utilise maintenant `quiz-service.ts` (Prisma uniquement)
   - Avant : `import { getAllQuiz } from '@/lib/wordpress'`
   - Après : `import { getAllQuiz } from '@/lib/quiz-service'`

4. **`src/lib/wordpress.ts`**
   - Ajouté : Détection du build pour éviter le fallback WordPress
   - Pendant le build, retourne un tableau vide au lieu d'essayer WordPress

## Pourquoi c'était nécessaire ?

### Avant les modifications

```
Build → generateStaticParams() → getAllQuizSlugs() (wordpress.ts)
                                    ↓
                          Tente de se connecter à WordPress
                                    ↓
                          ECONNREFUSED (WordPress non accessible)
                                    ↓
                          Erreurs dans les logs (mais build réussit)
```

### Après les modifications

```
Build → generateStaticParams() → getAllQuizSlugs() (quiz-service.ts)
                                    ↓
                          Utilise uniquement Prisma/PostgreSQL
                                    ↓
                          Pas de connexion WordPress nécessaire
                                    ↓
                          Build propre sans erreurs
```

## Résultat

✅ **Le build n'a plus besoin de WordPress**
- Toutes les pages utilisent maintenant Prisma/PostgreSQL
- Pas d'erreurs `ECONNREFUSED` pendant le build
- Le build est plus rapide et plus fiable

## Note importante

Le fichier `wordpress.ts` est conservé pour :
- Compatibilité avec l'ancien code
- Fallback en cas de problème avec Prisma (en développement uniquement)
- Migration progressive

Mais pendant le build, WordPress n'est **jamais** appelé.

## Vérification

Pour vérifier que WordPress n'est plus nécessaire :

```bash
# Désactiver WordPress temporairement
export WORDPRESS_API_URL=""

# Lancer le build
npm run build

# Le build devrait réussir sans erreurs WordPress
```
