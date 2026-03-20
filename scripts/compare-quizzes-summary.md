# Résumé de la comparaison WordPress vs Prisma

## Résultats actuels

### ❌ Problème détecté
L'API WordPress n'est **pas accessible** (erreur 404). Cela peut être dû à :
- WordPress n'est pas démarré
- L'URL `WORDPRESS_API_URL` n'est pas correcte
- L'API Tutor LMS n'est pas activée dans WordPress

### ✅ Données Prisma
- **201 quiz** sont présents dans la base de données Prisma
- Tous les quiz sont organisés en cours et modules

## Pour comparer les quiz

### Option 1: Vérifier manuellement dans WordPress
1. Connectez-vous à l'administration WordPress
2. Allez dans **Tutor LMS > Quizzes**
3. Comptez le nombre total de quiz
4. Comparez avec les **201 quiz** dans Prisma

### Option 2: Activer l'API WordPress
1. Vérifiez que WordPress est démarré (XAMPP)
2. Vérifiez l'URL dans `.env.local` : `WORDPRESS_API_URL`
3. Testez l'URL dans le navigateur : `http://localhost/test2/wp-json`
4. Activez l'API Tutor LMS si nécessaire

### Option 3: Utiliser le script de comparaison
Une fois WordPress accessible, exécutez :
```bash
npx tsx scripts/compare-wordpress-prisma-quizzes.ts
```

## Quiz dans Prisma

Les 201 quiz sont organisés comme suit :
- Cours publiés avec leurs modules
- Chaque module contient plusieurs quiz
- Les quiz sont accessibles via `/quiz/course/[slug]`

## Prochaines étapes

1. **Vérifier WordPress** : Assurez-vous que WordPress est accessible
2. **Comparer les nombres** : Vérifiez si le nombre de quiz correspond
3. **Vérifier les contenus** : Comparez quelques quiz manuellement pour vérifier la correspondance
