# Variables d'Environnement

## 📋 Variables Requises pour la Production

Créez un fichier `.env.local` (ou configurez-les dans votre plateforme de déploiement) avec les variables suivantes :

```bash
# URL du site en production
NEXT_PUBLIC_SITE_URL=https://theschoolofmathematics.com

# URL de votre backend WordPress
WORDPRESS_API_URL=https://votre-backend-wordpress.com
# Exemple: WORDPRESS_API_URL=https://api.theschoolofmathematics.com

# Google AdSense (optionnel)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxx

# Google Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Temps de revalidation ISR (en secondes)
NEXT_REVALIDATE_TIME=3600
```

## 🔐 Sécurité

⚠️ **IMPORTANT**: Ne jamais commiter le fichier `.env.local` dans Git. Il est déjà dans `.gitignore`.

## 📝 Notes

- Les variables commençant par `NEXT_PUBLIC_` sont accessibles côté client
- Les autres variables sont uniquement côté serveur
- Pour Vercel/Netlify, configurez ces variables dans les paramètres du projet

