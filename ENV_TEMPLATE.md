# Template des Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# ============================================
# BASE DE DONNÉES
# ============================================
# Pour le développement (SQLite) - NE PAS UTILISER EN PRODUCTION
# DATABASE_URL="file:./prisma/dev.db"

# Pour la production (PostgreSQL/Supabase)
# Sur Vercel (serverless) : utilisez le **pooler transactionnel** (port 6543 + pgbouncer)
# pour éviter timeouts et saturation des connexions Postgres.
# DIRECT_URL = connexion directe ou pooler session (5432) — réservée aux migrations Prisma.
#
# Exemple Vercel + Supabase Shared Pooler :
# DATABASE_URL="postgresql://postgres.PROJECT:[PASSWORD]@aws-0-....pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres.PROJECT:[PASSWORD]@aws-0-....pooler.supabase.com:5432/postgres"
#
# Encodez les caractères spéciaux du mot de passe dans l’URL (@ → %40, etc.)
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@db.hrtsiigolatifgyvipyc.supabase.co:5432/postgres?sslmode=require"
# DIRECT_URL="postgresql://postgres:votre_mot_de_passe@db.hrtsiigolatifgyvipyc.supabase.co:5432/postgres"

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# En production: NEXT_PUBLIC_SITE_URL=https://theschoolofmathematics.com

# ============================================
# WORDPRESS (Optionnel)
# ============================================
# WORDPRESS_API_URL=https://admin.votresite.com

# ============================================
# GOOGLE ADSENSE (Optionnel)
# ============================================
# NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxx

# ============================================
# GOOGLE ANALYTICS (Optionnel)
# ============================================
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ============================================
# ADMINISTRATION
# ============================================
# Mot de passe pour l'interface admin (/admin/login)
# Par défaut: admin123 (⚠️ Changez-le en production !)
ADMIN_PASSWORD=admin123

# ============================================
# CONFIGURATION
# ============================================
# NEXT_REVALIDATE_TIME=3600
NODE_ENV=development
```

## Notes Importantes

- ⚠️ **Ne jamais commiter `.env.local`** dans Git (déjà dans `.gitignore`)
- Les variables `NEXT_PUBLIC_*` sont accessibles côté client
- Les autres variables sont uniquement côté serveur
- Pour Vercel/Netlify, configurez ces variables dans les paramètres du projet
