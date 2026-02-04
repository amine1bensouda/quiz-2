# Template des Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# ============================================
# BASE DE DONNÉES
# ============================================
# Pour le développement (SQLite) - NE PAS UTILISER EN PRODUCTION
# DATABASE_URL="file:./prisma/dev.db"

# Pour la production (PostgreSQL/Supabase)
# Format: postgresql://postgres:VOTRE_MOT_DE_PASSE@db.xxxxx.supabase.co:5432/postgres?sslmode=require
# Récupérez cette URL depuis Supabase > Project Settings > Database > Connection String
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@db.hrtsiigolatifgyvipyc.supabase.co:5432/postgres?sslmode=require"

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
