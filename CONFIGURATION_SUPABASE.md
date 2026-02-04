# 🔧 Configuration Supabase - Étapes Détaillées

## 📋 Étape 1 : Récupérer la Connection String

1. **Dans votre dashboard Supabase**, cliquez sur **"Settings"** (icône d'engrenage) dans la barre latérale gauche

2. Allez dans **"Database"** dans le menu Settings

3. Faites défiler jusqu'à **"Connection string"**

4. Choisissez **"URI"** (pas "JDBC" ou "Connection pooling")

5. **Copiez la connection string** qui ressemble à :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

6. **Remplacez `[YOUR-PASSWORD]`** par le mot de passe que vous avez défini lors de la création du projet

7. **Ajoutez `?sslmode=require`** à la fin pour la sécurité :
   ```
   postgresql://postgres:votre_mot_de_passe@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```

---

## 📋 Étape 2 : Configurer les Variables d'Environnement

1. **Créez ou modifiez** le fichier `.env.local` à la racine de votre projet

2. **Ajoutez la connection string** :
   ```env
   DATABASE_URL="postgresql://postgres:votre_mot_de_passe@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
   ```

3. **Ajoutez aussi** :
   ```env
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NODE_ENV=development
   ```

⚠️ **IMPORTANT** : Ne commitez jamais `.env.local` dans Git !

---

## 📋 Étape 3 : Migrer le Schéma Prisma vers PostgreSQL

### 3.1 Sauvegarder le schéma SQLite actuel

```bash
# Dans le terminal, à la racine du projet
mv prisma/schema.prisma prisma/schema.sqlite.prisma
```

### 3.2 Utiliser le schéma PostgreSQL

```bash
# Copier le schéma PostgreSQL
mv prisma/schema.postgresql.prisma prisma/schema.prisma
```

### 3.3 Vérifier que le schéma utilise PostgreSQL

Ouvrez `prisma/schema.prisma` et vérifiez que vous avez :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Si c'est encore `provider = "sqlite"`, changez-le en `"postgresql"`.

---

## 📋 Étape 4 : Générer le Client Prisma

```bash
npx prisma generate
```

Cette commande va générer le client Prisma pour PostgreSQL.

---

## 📋 Étape 5 : Créer les Tables dans Supabase

```bash
npx prisma migrate dev --name init_postgresql
```

Cette commande va :
- Créer une migration
- Créer toutes les tables dans votre base Supabase
- Synchroniser le schéma

**Si vous voyez une erreur**, essayez :

```bash
npx prisma db push
```

Cette commande pousse directement le schéma sans créer de migration.

---

## 📋 Étape 6 : Vérifier que ça fonctionne

### 6.1 Ouvrir Prisma Studio

```bash
npx prisma studio
```

Cela ouvrira une interface web sur `http://localhost:5555` où vous pourrez voir vos tables.

### 6.2 Vérifier dans Supabase

1. Retournez dans votre dashboard Supabase
2. Cliquez sur **"Database"** dans la barre latérale
3. Cliquez sur **"Tables"**
4. Vous devriez voir toutes vos tables :
   - `courses`
   - `modules`
   - `quizzes`
   - `questions`
   - `answers`
   - `users`
   - `quiz_attempts`

---

## 📋 Étape 7 : Tester le Build

```bash
npm run build
```

Si tout fonctionne, vous verrez :
```
✓ Compiled successfully
```

Ensuite, testez le serveur :

```bash
npm start
```

---

## ⚠️ Résolution de Problèmes

### Erreur : "Can't reach database server"

**Solution** :
- Vérifiez que la connection string est correcte
- Vérifiez que `?sslmode=require` est ajouté
- Vérifiez votre mot de passe dans Supabase

### Erreur : "Schema is not empty"

**Solution** :
```bash
# Forcer la migration
npx prisma migrate reset
npx prisma migrate dev --name init
```

⚠️ **Attention** : Cela supprimera toutes les données existantes !

### Erreur : "P1001: Can't reach database server"

**Solution** :
- Vérifiez que votre projet Supabase est actif (pas en pause)
- Vérifiez que vous avez la bonne région
- Essayez de régénérer le mot de passe dans Supabase Settings → Database

---

## ✅ Checklist de Vérification

- [ ] Connection string récupérée depuis Supabase
- [ ] `.env.local` créé avec `DATABASE_URL`
- [ ] Schéma Prisma migré vers PostgreSQL
- [ ] `npx prisma generate` exécuté avec succès
- [ ] `npx prisma migrate dev` ou `npx prisma db push` exécuté
- [ ] Tables visibles dans Supabase Dashboard
- [ ] `npm run build` fonctionne sans erreur
- [ ] `npm start` démarre correctement

---

## 🎉 Une fois que tout fonctionne

Votre application Next.js est maintenant connectée à Supabase PostgreSQL !

Vous pouvez :
- Créer des cours/modules/quiz via l'admin
- Enregistrer des utilisateurs
- Sauvegarder les tentatives de quiz
- Tout fonctionne avec PostgreSQL en production

---

## 📝 Notes Importantes

1. **Sauvegardez votre mot de passe Supabase** dans un gestionnaire de mots de passe
2. **Ne partagez jamais** votre connection string publiquement
3. **Pour la production**, utilisez des variables d'environnement sécurisées
4. **Le statut "Unhealthy"** dans Supabase devrait disparaître une fois les tables créées
