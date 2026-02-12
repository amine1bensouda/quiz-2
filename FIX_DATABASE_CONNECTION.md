# 🔧 Résolution : Erreur de Connexion à la Base de Données

## ❌ Problème Identifié

Vous voyez l'erreur : **"Connection Error: Unable to connect to the database"**

Cela signifie que l'application ne peut pas se connecter à votre base de données Prisma.

---

## ✅ Solutions

### 1. Vérifier la Variable d'Environnement `DATABASE_URL`

**Sur Vercel :**
1. Allez sur votre projet Vercel → **Settings** → **Environment Variables**
2. Vérifiez que `DATABASE_URL` est définie
3. Vérifiez que la valeur est correcte

**Format attendu :**
```env
# Pour PostgreSQL (Vercel Postgres, Supabase, etc.)
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public

# Pour SQLite (développement local uniquement)
DATABASE_URL=file:./dev.db
```

---

### 2. Vérifier la Base de Données sur Vercel

**Si vous utilisez Vercel Postgres :**
1. Allez sur Vercel → Votre projet → **Storage**
2. Vérifiez que la base de données est créée et active
3. Copiez la `POSTGRES_URL` et ajoutez-la comme `DATABASE_URL`

**Si vous utilisez une base de données externe :**
- Vérifiez que la base de données est accessible depuis Internet
- Vérifiez que les credentials sont corrects
- Vérifiez que le firewall autorise les connexions depuis Vercel

---

### 3. Vérifier la Connexion Locale

**Pour tester localement :**
```bash
# Vérifier que DATABASE_URL est définie
echo $DATABASE_URL

# Ou dans PowerShell (Windows)
echo $env:DATABASE_URL

# Tester la connexion Prisma
npx prisma db pull
```

---

### 4. Migrer la Base de Données

Si la base de données est vide ou non migrée :

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Ou créer la base de données si elle n'existe pas
npx prisma migrate dev
```

---

### 5. Vérifier le Schéma Prisma

Vérifiez que `prisma/schema.prisma` contient les bons modèles :

```prisma
datasource db {
  provider = "postgresql" // ou "sqlite" pour le développement local
  url      = env("DATABASE_URL")
}

model Course {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?
  status      String   @default("draft")
  // ... autres champs
}
```

---

## 🔍 Diagnostic

### Tester la Connexion via l'API Health

L'application a une route `/api/health` qui vérifie la connexion :

```bash
curl https://votre-site.vercel.app/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

Si vous voyez `"database": "disconnected"`, c'est un problème de connexion.

---

### Vérifier les Logs Vercel

1. Allez sur Vercel → Votre projet → **Deployments**
2. Cliquez sur le dernier déploiement
3. Regardez les **Logs** pour voir les erreurs exactes

---

## 🚀 Actions Immédiates

1. **Vérifiez `DATABASE_URL` sur Vercel**
   - Settings → Environment Variables
   - Assurez-vous qu'elle est définie pour Production, Preview, et Development

2. **Créez/Vérifiez la Base de Données**
   - Si vous n'avez pas de base de données, créez-en une sur Vercel Postgres
   - Ou utilisez Supabase, Railway, Neon, etc.

3. **Appliquez les Migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Redéployez sur Vercel**
   - Allez sur Deployments → Redeploy

---

## 📝 Notes Importantes

- **SQLite ne fonctionne PAS sur Vercel** - Utilisez PostgreSQL
- **La variable `DATABASE_URL` doit être définie** pour tous les environnements
- **Les migrations doivent être appliquées** avant que l'application fonctionne
- **Le cache ISR peut prendre jusqu'à 1 heure** pour se mettre à jour

---

## ✅ Après Correction

Une fois la connexion rétablie :
1. Les cours devraient s'afficher dans `/admin/courses`
2. Les cours publiés devraient apparaître sur `/quiz`
3. Le contenu HTML devrait être rendu correctement (plus de HTML brut)

---

## 🆘 Si le Problème Persiste

1. Vérifiez les logs Vercel pour les erreurs exactes
2. Vérifiez que Prisma Client est généré (`npx prisma generate`)
3. Vérifiez que les migrations sont appliquées
4. Contactez le support avec les détails de l'erreur
