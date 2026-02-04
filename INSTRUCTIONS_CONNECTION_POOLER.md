# Instructions : Utiliser le Session Pooler Supabase

## Problème
L'erreur "Can't reach database server" peut être due à un problème IPv4. Supabase recommande d'utiliser le **Session Pooler** pour les connexions IPv4.

## Solution : Utiliser le Session Pooler

### Étape 1 : Récupérer la connection string du Pooler

1. Dans Supabase, allez dans **Project Settings** → **Database**
2. Cliquez sur l'onglet **"Connection pooling"**
3. Sélectionnez **"Session mode"**
4. Copiez la connection string qui ressemble à :
   ```
   postgresql://postgres.hrtsiigolatifgyvipyc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
   **Note** : Le port est `6543` (pas `5432`) et l'hôte contient `pooler.supabase.com`

### Étape 2 : Formater la connection string

Remplacez `[YOUR-PASSWORD]` par votre mot de passe (`Amine@2005wac`) et encodez le `@` en `%40` :

```
postgresql://postgres.hrtsiigolatifgyvipyc:Amine%402005wac@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Étape 3 : Mettre à jour le fichier `.env`

Mettez à jour votre fichier `.env` avec la nouvelle connection string du pooler.

### Étape 4 : Tester la connexion

```powershell
npx prisma db push
```

---

## Alternative : Vérifier que le projet n'est pas en pause

1. Dans Supabase, allez dans **Project Settings** → **General**
2. Vérifiez que le projet n'est pas en pause
3. Si c'est le cas, cliquez sur **"Restart project"**

---

## Vérification du mot de passe

Si le problème persiste, vérifiez votre mot de passe :

1. Allez dans **Project Settings** → **Database** → **Database Settings**
2. Cliquez sur **"Reset database password"**
3. Entrez un nouveau mot de passe (notez-le bien)
4. Utilisez ce nouveau mot de passe dans la connection string
