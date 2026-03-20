# 🔍 Diagnostic des Problèmes sur Vercel

## ✅ Checklist de Vérification

### 1. Vérifier les Variables d'Environnement sur Vercel

Allez dans **Vercel Dashboard > Votre Projet > Settings > Environment Variables** et vérifiez :

#### Variables Requises :

```env
DATABASE_URL=postgresql://postgres.hrtsiigolatifgyvipyc:[VOTRE_MOT_DE_PASSE]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
ADMIN_PASSWORD=votre-mot-de-passe-admin
NEXT_PUBLIC_SITE_URL=https://votre-site.vercel.app
```

⚠️ **IMPORTANT** :
- Utilisez le **Session Pooler** de Supabase (port 5432) pour IPv4
- Le format est : `postgresql://postgres.hrtsiigolatifgyvipyc:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
- Remplacez `[PASSWORD]` par votre vrai mot de passe (encodez les caractères spéciaux comme `@` en `%40`)

### 2. Tester la Route de Diagnostic

Après le déploiement, visitez :
```
https://votre-site.vercel.app/api/health
```

Cette route vous indiquera :
- ✅ Si la connexion à la base de données fonctionne
- ✅ Si les variables d'environnement sont configurées
- ❌ Les erreurs détaillées si quelque chose ne va pas

### 3. Vérifier les Logs Vercel

1. Allez dans **Vercel Dashboard > Votre Projet > Deployments**
2. Cliquez sur le dernier déploiement
3. Ouvrez l'onglet **"Functions"** ou **"Logs"**
4. Recherchez les erreurs liées à :
   - `P1001` (connexion à la base de données)
   - `DATABASE_URL`
   - `Prisma`

### 4. Problèmes Courants et Solutions

#### ❌ Erreur : "Can't reach database server"

**Cause** : `DATABASE_URL` incorrecte ou Supabase non accessible

**Solution** :
1. Vérifiez que vous utilisez le **Session Pooler** (pas Direct Connection)
2. Vérifiez que le mot de passe est correct dans `DATABASE_URL`
3. Vérifiez que Supabase n'est pas en pause
4. Testez la connexion depuis votre machine locale avec le même `DATABASE_URL`

#### ❌ Erreur : "Unexpected end of JSON input"

**Cause** : La réponse de l'API n'est pas du JSON valide

**Solution** :
- Les corrections ont été appliquées dans `auth-client.ts`
- Vérifiez les logs Vercel pour voir l'erreur exacte
- La route `/api/health` peut aider à diagnostiquer

#### ❌ Erreur : Les cookies ne fonctionnent pas

**Cause** : Configuration des cookies incorrecte pour HTTPS

**Solution** :
- Les cookies sont maintenant configurés avec `secure: true` sur Vercel
- Vérifiez que votre site utilise HTTPS (Vercel le fait automatiquement)

### 5. Tester l'Inscription et la Connexion

1. **Test d'inscription** :
   - Visitez `https://votre-site.vercel.app/register`
   - Remplissez le formulaire
   - Vérifiez les logs Vercel si ça échoue

2. **Test de connexion** :
   - Visitez `https://votre-site.vercel.app/login`
   - Connectez-vous avec un compte existant
   - Vérifiez les logs Vercel si ça échoue

### 6. Vérifier Supabase

1. Allez dans **Supabase Dashboard > Votre Projet**
2. Vérifiez que le projet n'est pas en pause
3. Vérifiez que la base de données est accessible
4. Testez une requête SQL simple dans l'éditeur SQL :
   ```sql
   SELECT COUNT(*) FROM "User";
   ```

### 7. Redéployer après les Corrections

Après avoir corrigé les variables d'environnement :

1. Allez dans **Vercel Dashboard > Votre Projet > Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Sélectionnez **"Redeploy"**
4. Attendez la fin du déploiement
5. Testez à nouveau

## 📝 Format de DATABASE_URL pour Supabase

### Session Pooler (Recommandé pour Vercel)

```env
DATABASE_URL=postgresql://postgres.hrtsiigolatifgyvipyc:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Où trouver cette URL** :
1. Supabase Dashboard > Votre Projet > Settings > Database
2. Section "Connection String"
3. Type: **URI**
4. Source: **Primary Database**
5. Method: **Session pooler**

**Important** :
- Remplacez `[PASSWORD]` par votre mot de passe
- Si votre mot de passe contient `@`, encodez-le en `%40`
- Exemple : `password@123` devient `password%40123`

## 🆘 Support

Si le problème persiste :
1. Vérifiez les logs Vercel
2. Testez la route `/api/health`
3. Vérifiez que Supabase est accessible
4. Vérifiez que toutes les variables d'environnement sont correctes
