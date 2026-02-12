# 🔧 Solutions aux Erreurs de Build sur Vercel

## 📋 Erreurs Courantes et Solutions

### 1. ❌ Erreur : Variables d'environnement manquantes

**Symptômes :**
```
Error: Environment variable DATABASE_URL is missing
Error: Cannot read property 'WORDPRESS_API_URL' of undefined
```

**Solution :**
1. Allez dans votre projet Vercel → Settings → Environment Variables
2. Ajoutez toutes les variables requises :

```env
# REQUIS
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Optionnel mais recommandé
WORDPRESS_API_URL=https://your-wordpress-site.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-hashed-password
NEXT_REVALIDATE_TIME=3600
```

**Important :** Après avoir ajouté les variables, redéployez le projet.

---

### 2. ❌ Erreur : ESLint bloque le build

**Symptômes :**
```
Failed to compile.
./src/components/...
ESLint: 'variable' is assigned a value but never used.
```

**Solution A : Désactiver temporairement ESLint pour le build**

Modifiez `next.config.js` :

```javascript
const nextConfig = {
  eslint: {
    // ⚠️ Désactive ESLint pendant le build (non recommandé pour la production)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Désactive la vérification TypeScript pendant le build
    ignoreBuildErrors: false, // Gardez false pour la sécurité
  },
  // ... reste de la config
}
```

**Solution B : Corriger les erreurs ESLint (recommandé)**

Exécutez localement :
```bash
npm run lint
```

Corrigez les erreurs affichées, puis recommitez et poussez.

---

### 3. ❌ Erreur : TypeScript strict mode

**Symptômes :**
```
Type error: Type 'undefined' is not assignable to type 'number'.
Type error: Property 'x' does not exist on type 'y'.
```

**Solution :**
1. Vérifiez que tous les types sont corrects
2. Utilisez des types optionnels (`?`) quand nécessaire
3. Ajoutez des valeurs par défaut

Exemple :
```typescript
// ❌ Mauvais
duration: number;

// ✅ Bon
duration?: number;
// ou
duration: number | undefined;
```

---

### 4. ❌ Erreur : Prisma Client non généré

**Symptômes :**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

**Solution :**
Le script `postinstall` dans `package.json` devrait déjà gérer cela :
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Si l'erreur persiste, vérifiez que :
1. Le fichier `prisma/schema.prisma` existe
2. La commande `postinstall` est bien dans `package.json`
3. Vercel peut exécuter `prisma generate` (vérifiez les logs de build)

---

### 5. ❌ Erreur : Module non trouvé

**Symptômes :**
```
Module not found: Can't resolve '@/components/...'
Error: Cannot find module 'react-quill'
```

**Solution :**
1. Vérifiez que toutes les dépendances sont dans `package.json`
2. Vérifiez que `tsconfig.json` a les bons paths :
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

3. Réinstallez les dépendances :
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### 6. ❌ Erreur : Build timeout

**Symptômes :**
```
Build exceeded maximum build time
```

**Solution :**
1. Vérifiez que le build ne fait pas trop de requêtes API
2. Optimisez les `getStaticProps` et `getStaticPaths`
3. Utilisez `fallback: 'blocking'` au lieu de générer toutes les pages

---

### 7. ❌ Erreur : Database connection

**Symptômes :**
```
Error: P1001: Can't reach database server
Error: Connection timeout
```

**Solution :**
1. Vérifiez que `DATABASE_URL` est correcte dans Vercel
2. Vérifiez que la base de données autorise les connexions depuis Vercel
3. Pour Vercel Postgres, utilisez `POSTGRES_URL` au lieu de `DATABASE_URL`
4. Vérifiez les paramètres SSL si nécessaire :
```
DATABASE_URL=postgresql://...?sslmode=require
```

---

### 8. ❌ Erreur : Sharp (images)

**Symptômes :**
```
Error: Cannot find module 'sharp'
```

**Solution :**
Sharp est déjà dans les dépendances. Si l'erreur persiste :
1. Vérifiez que `sharp` est dans `package.json`
2. Vercel devrait l'installer automatiquement
3. Si nécessaire, ajoutez dans `vercel.json` :
```json
{
  "functions": {
    "app/**": {
      "runtime": "nodejs18.x"
    }
  }
}
```

---

## 🔍 Comment Déboguer

### 1. Vérifier les logs de build sur Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur "Deployments"
3. Cliquez sur le dernier déploiement (même s'il a échoué)
4. Regardez les logs de build pour voir l'erreur exacte

### 2. Tester le build localement

```bash
# Nettoyer
rm -rf .next node_modules

# Réinstaller
npm install

# Build
npm run build
```

### 3. Vérifier les variables d'environnement

Créez un fichier `.env.local` avec les mêmes variables que Vercel et testez localement.

---

## ✅ Checklist avant de pousser vers Vercel

- [ ] Le build local fonctionne (`npm run build`)
- [ ] Pas d'erreurs ESLint (`npm run lint`)
- [ ] Pas d'erreurs TypeScript
- [ ] Toutes les variables d'environnement sont configurées sur Vercel
- [ ] La base de données est accessible depuis Vercel
- [ ] Les dépendances sont à jour (`package.json`)

---

## 🚀 Commandes Utiles

```bash
# Build local
npm run build

# Linter
npm run lint

# Vérifier les types
npx tsc --noEmit

# Générer Prisma Client
npx prisma generate

# Vérifier les variables d'environnement
node -e "console.log(process.env.DATABASE_URL)"
```

---

## 📞 Besoin d'aide ?

Si vous avez toujours des erreurs :
1. Copiez le message d'erreur complet depuis Vercel
2. Vérifiez les logs de build
3. Partagez les détails pour un diagnostic plus précis
