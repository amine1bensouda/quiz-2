# Guide Étape par Étape : Configuration Supabase

## 📋 Vue d'ensemble

Ce guide vous accompagne pour connecter votre projet Next.js à Supabase (PostgreSQL).

**Durée estimée :** 10-15 minutes

---

## ÉTAPE 1 : Récupérer la Connection String depuis Supabase

### 1.1 Accéder aux paramètres de la base de données

1. Dans votre projet Supabase, cliquez sur **"Project Settings"** (icône ⚙️ en bas à gauche)
2. Dans le menu de gauche, cliquez sur **"Database"**
3. Faites défiler jusqu'à la section **"Connection string"**

### 1.2 Copier la connection string

1. Dans l'onglet **"Connection String"**, sélectionnez :
   - **Type** : `URI`
   - **Source** : `Primary Database`
   - **Method** : `Direct connection` (ou `Session mode` si vous avez des problèmes IPv4)

2. **Copiez la connection string** qui ressemble à :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.hrtsiigolatifgyvipyc.supabase.co:5432/postgres
   ```

### 1.3 Récupérer votre mot de passe

⚠️ **Important** : Remplacez `[YOUR-PASSWORD]` par votre mot de passe Supabase.

**Si vous ne connaissez pas votre mot de passe :**
1. Cliquez sur **"Reset your database password"** → **"Database Settings"**
2. Entrez un nouveau mot de passe (notez-le bien !)
3. Cliquez sur **"Reset password"**

### 1.4 Formater la connection string complète

Votre connection string finale doit ressembler à :
```
postgresql://postgres:votre_mot_de_passe@db.hrtsiigolatifgyvipyc.supabase.co:5432/postgres?sslmode=require
```

**Note** : Ajoutez `?sslmode=require` à la fin pour la sécurité SSL.

---

## ÉTAPE 2 : Créer le fichier `.env.local`

### 2.1 Créer le fichier

1. À la racine de votre projet (`C:\xampp\htdocs\quiz-main\`), créez un fichier nommé `.env.local`
2. Ouvrez-le avec un éditeur de texte (VS Code, Notepad++, etc.)

### 2.2 Ajouter les variables d'environnement

Copiez-collez ce contenu dans `.env.local` :

```env
# Base de données Supabase (PostgreSQL)
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@db.hrtsiigolatifgyvipyc.supabase.co:5432/postgres?sslmode=require"

# URL du site (développement)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Environnement
NODE_ENV=development

# WordPress (si vous l'utilisez encore)
WORDPRESS_API_URL=http://localhost/test2/wp-json/tutor/v1
```

**⚠️ IMPORTANT** : 
- Remplacez `votre_mot_de_passe` par votre vrai mot de passe Supabase
- Gardez les guillemets autour de la `DATABASE_URL`

### 2.3 Sauvegarder le fichier

Sauvegardez le fichier `.env.local` (Ctrl+S)

---

## ÉTAPE 3 : Migrer le schéma Prisma vers PostgreSQL

### 3.1 Sauvegarder le schéma SQLite actuel

Dans votre terminal PowerShell, exécutez :

```powershell
cd C:\xampp\htdocs\quiz-main
mv prisma/schema.prisma prisma/schema.sqlite.prisma
```

**Explication** : On sauvegarde l'ancien schéma SQLite au cas où vous en auriez besoin plus tard.

### 3.2 Utiliser le schéma PostgreSQL

```powershell
mv prisma/schema.postgresql.prisma prisma/schema.prisma
```

**Explication** : On remplace le schéma SQLite par le schéma PostgreSQL optimisé.

---

## ÉTAPE 4 : Générer le client Prisma

### 4.1 Arrêter le serveur Next.js (si en cours)

Si votre serveur Next.js tourne :
1. Appuyez sur `Ctrl+C` dans le terminal où il tourne
2. Attendez qu'il s'arrête complètement

### 4.2 Générer le client Prisma

```powershell
npx prisma generate
```

**Ce que fait cette commande :**
- Lit le nouveau schéma PostgreSQL
- Génère le client Prisma TypeScript
- Met à jour les types TypeScript

**⏱️ Durée** : 30-60 secondes

**✅ Résultat attendu :**
```
✔ Generated Prisma Client (X.XX.X) to .\node_modules\.prisma\client in XXXms
```

---

## ÉTAPE 5 : Créer les tables dans Supabase

### 5.1 Pousser le schéma vers la base de données

```powershell
npx prisma db push
```

**Ce que fait cette commande :**
- Se connecte à Supabase
- Crée toutes les tables (courses, modules, quizzes, questions, answers, users, quiz_attempts)
- Configure les relations entre les tables
- Ajoute les index pour optimiser les performances

**⏱️ Durée** : 10-30 secondes

**✅ Résultat attendu :**
```
✔ The database is now in sync with your Prisma schema.

✔ Generated Prisma Client (X.XX.X) to .\node_modules\.prisma\client in XXXms
```

**❌ Si vous avez une erreur :**
- Vérifiez que votre mot de passe dans `.env.local` est correct
- Vérifiez que `?sslmode=require` est présent dans `DATABASE_URL`
- Vérifiez que votre projet Supabase n'est pas en pause

---

## ÉTAPE 6 : Vérifier la connexion

### 6.1 Ouvrir Prisma Studio

```powershell
npx prisma studio
```

**Ce que fait cette commande :**
- Ouvre une interface web sur `http://localhost:5555`
- Affiche toutes vos tables Supabase
- Permet de voir et modifier les données

**✅ Résultat attendu :**
- Une fenêtre de navigateur s'ouvre automatiquement
- Vous voyez les tables : `courses`, `modules`, `quizzes`, `questions`, `answers`, `users`, `quiz_attempts`
- Les tables sont vides pour l'instant (normal, c'est une nouvelle base)

### 6.2 Fermer Prisma Studio

Dans le terminal, appuyez sur `Ctrl+C` pour fermer Prisma Studio.

---

## ÉTAPE 7 : Redémarrer le serveur Next.js

### 7.1 Démarrer le serveur

```powershell
npm run dev
```

### 7.2 Vérifier que tout fonctionne

1. Ouvrez `http://localhost:3000` dans votre navigateur
2. Vérifiez qu'il n'y a pas d'erreurs dans la console du navigateur (F12)
3. Vérifiez qu'il n'y a pas d'erreurs dans le terminal

**✅ Si tout fonctionne :**
- Le site se charge normalement
- Les pages s'affichent sans erreur
- Pas d'erreur de connexion à la base de données

**❌ Si vous avez des erreurs :**
- Vérifiez les logs dans le terminal
- Vérifiez que `.env.local` est bien configuré
- Vérifiez que `npx prisma generate` a bien été exécuté

---

## ÉTAPE 8 : Migrer les données (optionnel)

⚠️ **Important** : Si vous avez des données dans votre base SQLite locale que vous voulez migrer vers Supabase, vous devrez créer un script de migration.

**Pour l'instant, votre base Supabase est vide.** C'est normal si vous partez de zéro.

**Si vous avez déjà des données SQLite :**
1. Exportez les données depuis SQLite
2. Créez un script pour les importer dans Supabase
3. Exécutez le script

---

## ✅ Checklist finale

Cochez chaque étape au fur et à mesure :

- [ ] Connection string Supabase copiée avec le bon mot de passe
- [ ] Fichier `.env.local` créé avec `DATABASE_URL` correcte
- [ ] Schéma SQLite sauvegardé (`schema.sqlite.prisma`)
- [ ] Schéma PostgreSQL activé (`schema.prisma`)
- [ ] `npx prisma generate` exécuté avec succès
- [ ] `npx prisma db push` exécuté avec succès
- [ ] Tables créées dans Supabase (vérifié avec Prisma Studio)
- [ ] Serveur Next.js redémarré sans erreur
- [ ] Site fonctionne sur `http://localhost:3000`

---

## 🆘 Résolution de problèmes

### Erreur : "Can't reach database server"

**Solutions :**
1. Vérifiez que votre projet Supabase n'est pas en pause
2. Vérifiez votre mot de passe dans `.env.local`
3. Essayez d'utiliser le "Session Pooler" au lieu de "Direct connection"

### Erreur : "SSL connection required"

**Solution :**
Ajoutez `?sslmode=require` à la fin de votre `DATABASE_URL`

### Erreur : "Not IPv4 compatible"

**Solution :**
1. Dans Supabase, allez dans "Database" → "Connection pooling"
2. Utilisez la connection string du "Session Pooler"
3. Remplacez `DATABASE_URL` dans `.env.local`

### Erreur : "Prisma Client not generated"

**Solution :**
```powershell
npx prisma generate
```

### Erreur : "Table already exists"

**Solution :**
Si vous avez déjà créé les tables, utilisez :
```powershell
npx prisma migrate dev --name init
```

---

## 📚 Ressources supplémentaires

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Guide PostgreSQL du projet](./GUIDE_POSTGRESQL.md)

---

## 🎉 Félicitations !

Votre projet est maintenant connecté à Supabase (PostgreSQL) et prêt pour la production !

**Prochaines étapes :**
- Tester la création de compte utilisateur
- Tester la création de cours/modules/quiz depuis l'admin
- Préparer le déploiement sur Vercel/Netlify
