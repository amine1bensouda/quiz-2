# 🔧 Correction de la Connexion Supabase

## Problème
L'erreur "Can't reach database server" indique que la connexion directe (port 5432) n'est pas compatible IPv4.

## Solution : Utiliser le Session Pooler

### Étape 1 : Obtenir la Connection String du Pooler

1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Project Settings** → **Database**
4. Cliquez sur l'onglet **"Connection pooling"** (en haut)
5. Sélectionnez **"Session mode"** dans le dropdown "Method"
6. Copiez la connection string qui ressemble à :

```
postgresql://postgres.hrtsiigolatifgyvipyc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Important** : 
- Le port est **6543** (pas 5432)
- L'hôte contient **`pooler.supabase.com`** (pas `db.xxxxx.supabase.co`)

### Étape 2 : Formater la Connection String

Remplacez `[YOUR-PASSWORD]` par votre mot de passe (`Amine@2005wac`) et **encodez le `@` en `%40`** :

```
postgresql://postgres.hrtsiigolatifgyvipyc:Amine%402005wac@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Étape 3 : Mettre à jour `.env.local`

Ouvrez votre fichier `.env.local` et remplacez la ligne `DATABASE_URL` par :

```env
DATABASE_URL="postgresql://postgres.hrtsiigolatifgyvipyc:Amine%402005wac@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

**Note** : Remplacez `aws-0-us-east-1.pooler.supabase.com` par l'hôte réel que vous voyez dans Supabase.

### Étape 4 : Redémarrer le Serveur

1. Arrêtez le serveur (Ctrl+C)
2. Redémarrez : `npm run dev`

### Étape 5 : Vérifier la Connexion

```bash
npx tsx scripts/test-db-connection.ts
```

Vous devriez voir : `✅ Connexion à la base de données réussie!`

---

## Alternative : Vérifier que le Projet n'est pas en Pause

Si le problème persiste :

1. Dans Supabase, allez dans **Project Settings** → **General**
2. Vérifiez que le projet n'est pas en pause
3. Si c'est le cas, cliquez sur **"Restart project"**

---

## Si vous ne trouvez pas le Session Pooler

Si vous ne voyez pas l'onglet "Connection pooling" :

1. Allez dans **Project Settings** → **Database**
2. Cherchez la section **"Connection string"**
3. Changez **"Method"** de "Direct connection" à **"Session mode"**
4. Copiez la nouvelle connection string
