# 🔧 Guide de Résolution - Problème d'Authentification sur Vercel

## 📋 Étapes pour Résoudre le Problème

### Étape 1 : Accéder aux Variables d'Environnement sur Vercel

1. **Connectez-vous à Vercel** : https://vercel.com
2. **Sélectionnez votre projet** (The School of Mathematics)
3. Allez dans **Settings** (Paramètres) dans le menu de gauche
4. Cliquez sur **Environment Variables** (Variables d'environnement)

### Étape 2 : Vérifier/Créer les Variables d'Environnement

Vous devez avoir **3 variables** configurées :

#### ✅ Variable 1 : `DATABASE_URL`

**Format requis** (Session Pooler de Supabase) :
```
postgresql://postgres.hrtsiigolatifgyvipyc:[VOTRE_MOT_DE_PASSE]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Comment obtenir cette URL** :
1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Database**
4. Section **Connection String**
5. Configurez :
   - **Type** : `URI`
   - **Source** : `Primary Database`
   - **Method** : `Session pooler` ⚠️ **IMPORTANT : Utilisez Session pooler, pas Direct connection**
6. Copiez l'URL qui ressemble à :
   ```
   postgresql://postgres.hrtsiigolatifgyvipyc:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```
7. Remplacez `[YOUR-PASSWORD]` par votre vrai mot de passe
8. **Si votre mot de passe contient des caractères spéciaux**, encodez-les :
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - etc.

**Exemple** :
- Mot de passe : `Amine@2005wac`
- Encodé : `Amine%402005wac`
- URL complète : `postgresql://postgres.hrtsiigolatifgyvipyc:Amine%402005wac@aws-0-us-west-2.pooler.supabase.com:5432/postgres`

**Dans Vercel** :
- **Key** : `DATABASE_URL`
- **Value** : L'URL complète avec le mot de passe encodé
- **Environments** : Cochez toutes les cases (Production, Preview, Development)

#### ✅ Variable 2 : `ADMIN_PASSWORD`

- **Key** : `ADMIN_PASSWORD`
- **Value** : Votre mot de passe admin (ex: `admin1234`)
- **Environments** : Cochez toutes les cases

#### ✅ Variable 3 : `NEXT_PUBLIC_SITE_URL`

- **Key** : `NEXT_PUBLIC_SITE_URL`
- **Value** : L'URL de votre site Vercel (ex: `https://votre-projet.vercel.app`)
- **Environments** : Cochez toutes les cases

### Étape 3 : Vérifier que Supabase n'est pas en Pause

1. Allez sur **Supabase Dashboard**
2. Vérifiez que votre projet n'affiche pas **"Paused"**
3. Si c'est le cas, cliquez sur **"Resume"** pour le réactiver

### Étape 4 : Redéployer sur Vercel

**Option A : Redéploiement depuis le Dashboard**

1. Dans Vercel, allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** (⋮) à droite
4. Sélectionnez **"Redeploy"**
5. Confirmez le redéploiement
6. Attendez la fin du build (2-5 minutes)

**Option B : Redéploiement via Git**

Si vous avez fait des changements dans le code :
```bash
git add .
git commit -m "Fix: Amélioration de la gestion d'erreur pour Vercel"
git push
```
Vercel redéploiera automatiquement.

### Étape 5 : Tester la Route de Diagnostic

Après le redéploiement, visitez :
```
https://votre-site.vercel.app/api/health
```

**Résultat attendu** (si tout fonctionne) :
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection successful"
    },
    "environment": {
      "DATABASE_URL": "configured",
      "ADMIN_PASSWORD": "configured",
      "NEXT_PUBLIC_SITE_URL": "https://votre-site.vercel.app"
    }
  }
}
```

**Si vous voyez une erreur** :
- `"status": "error"` → La connexion à la base de données échoue
- `"DATABASE_URL": "missing"` → La variable n'est pas configurée
- Vérifiez les logs Vercel pour plus de détails

### Étape 6 : Vérifier les Logs Vercel

Si le problème persiste :

1. Dans Vercel, allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Ouvrez l'onglet **"Functions"** ou **"Logs"**
4. Recherchez les erreurs contenant :
   - `P1001` (erreur de connexion Prisma)
   - `Can't reach database`
   - `DATABASE_URL`
   - `Prisma`

### Étape 7 : Tester l'Inscription et la Connexion

1. **Test d'inscription** :
   - Visitez `https://votre-site.vercel.app/register`
   - Remplissez le formulaire avec un nouvel email
   - Si ça échoue, ouvrez la console du navigateur (F12) et regardez les erreurs

2. **Test de connexion** :
   - Visitez `https://votre-site.vercel.app/login`
   - Connectez-vous avec un compte existant
   - Si ça échoue, vérifiez les logs Vercel

## 🔍 Diagnostic des Erreurs Courantes

### ❌ Erreur : "Can't reach database server"

**Cause** : `DATABASE_URL` incorrecte ou Supabase inaccessible

**Solution** :
1. Vérifiez que vous utilisez le **Session Pooler** (port 5432)
2. Vérifiez que le mot de passe est correct et encodé
3. Vérifiez que Supabase n'est pas en pause
4. Testez la connexion depuis votre machine locale avec le même `DATABASE_URL`

### ❌ Erreur : "Unexpected end of JSON input"

**Cause** : La réponse de l'API n'est pas du JSON valide

**Solution** :
- Les corrections ont été appliquées dans le code
- Vérifiez les logs Vercel pour voir l'erreur exacte
- La route `/api/health` peut aider à diagnostiquer

### ❌ Erreur : "Database connection error"

**Cause** : Problème de connexion à Supabase

**Solution** :
1. Vérifiez que `DATABASE_URL` est correcte
2. Vérifiez que Supabase est actif (pas en pause)
3. Vérifiez que vous utilisez le Session Pooler
4. Testez avec `/api/health`

### ❌ Les cookies ne fonctionnent pas

**Cause** : Configuration des cookies incorrecte

**Solution** :
- Les cookies sont maintenant configurés avec `secure: true` sur Vercel
- Vérifiez que votre site utilise HTTPS (Vercel le fait automatiquement)
- Les cookies devraient fonctionner automatiquement

## 📝 Checklist de Vérification

Avant de tester, vérifiez que :

- [ ] `DATABASE_URL` est configurée avec le Session Pooler
- [ ] Le mot de passe dans `DATABASE_URL` est encodé (si nécessaire)
- [ ] `ADMIN_PASSWORD` est configurée
- [ ] `NEXT_PUBLIC_SITE_URL` est configurée
- [ ] Toutes les variables sont activées pour Production, Preview et Development
- [ ] Supabase n'est pas en pause
- [ ] Vous avez redéployé après avoir modifié les variables
- [ ] La route `/api/health` retourne `"status": "ok"`

## 🆘 Si le Problème Persiste

1. **Vérifiez les logs Vercel** pour voir l'erreur exacte
2. **Testez la route `/api/health`** pour diagnostiquer
3. **Vérifiez Supabase** :
   - Le projet est-il actif ?
   - La base de données est-elle accessible ?
   - Testez une requête SQL simple dans l'éditeur SQL
4. **Vérifiez les variables d'environnement** :
   - Sont-elles toutes présentes ?
   - Les valeurs sont-elles correctes ?
   - Le mot de passe est-il encodé ?

## 💡 Astuce : Encoder le Mot de Passe

Si votre mot de passe contient des caractères spéciaux, utilisez un encodeur URL en ligne :
- https://www.urlencoder.org/
- Entrez votre mot de passe
- Copiez le résultat encodé
- Utilisez-le dans `DATABASE_URL`

**Exemple** :
- Mot de passe original : `Amine@2005wac#`
- Mot de passe encodé : `Amine%402005wac%23`
- Utilisez le mot de passe encodé dans `DATABASE_URL`
