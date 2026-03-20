# 🔧 Correction de l'erreur "Tenant or user not found"

## Problème

L'erreur `FATAL: Tenant or user not found` indique que la connection string du Session Pooler n'est pas correcte.

## Solution

### Étape 1 : Obtenir la bonne connection string depuis Supabase

1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Project Settings** → **Database**
4. Cliquez sur l'onglet **"Connection pooling"** (ou changez "Method" vers "Session mode")
5. **Copiez la connection string complète** qui ressemble à :

```
postgresql://postgres.hrtsiigolatifgyvipyc:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Important** : 
- L'hôte peut être différent selon votre région (exemple : `aws-0-us-west-2`, `aws-0-us-east-1`, etc.)
- Le port peut être **5432** ou **6543** selon votre configuration Supabase (vérifiez dans le dashboard)
- L'utilisateur doit être au format `postgres.[PROJECT_REF]`

### Étape 2 : Formater la connection string

Remplacez `[YOUR-PASSWORD]` par votre mot de passe (`Amine@2005wac`) et **encodez le `@` en `%40`** :

```
postgresql://postgres.hrtsiigolatifgyvipyc:Amine%402005wac@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**Remplacez l'hôte et le port** par ceux affichés dans votre dashboard Supabase.

### Étape 3 : Mettre à jour `.env.local`

Ouvrez `.env.local` et remplacez la ligne `DATABASE_URL` par la connection string correcte.

### Étape 4 : Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

## Vérification

Testez la connexion :

```bash
npx tsx scripts/test-db-connection.ts
```

Vous devriez voir : `✅ Connexion à la base de données réussie!`

## Format correct de la connection string

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD_ENCODE]@[POOLER_HOST]:6543/postgres?sslmode=require"
```

Exemple :
```env
DATABASE_URL="postgresql://postgres.hrtsiigolatifgyvipyc:Amine%402005wac@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Note** : L'hôte et le port peuvent varier selon votre région et configuration Supabase. Utilisez ceux affichés dans votre dashboard Supabase (onglet "Connection pooling" → "Session pooler").
