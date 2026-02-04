# Guide de Déploiement sur Hostinger

## 🚀 Déploiement de Next.js sur Hostinger

Hostinger propose plusieurs options pour héberger une application Next.js. Voici les méthodes recommandées :

---

## Option 1: Export Statique (Recommandé pour Hostinger)

Cette méthode convertit votre site Next.js en fichiers HTML statiques, ce qui fonctionne parfaitement avec l'hébergement web classique de Hostinger.

### Étapes :

1. **Modifier `next.config.js` pour l'export statique**

   Ajoutez cette configuration :

   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true, // Nécessaire pour l'export statique
     },
     // ... reste de votre config
   }
   ```

2. **Build du site en statique**

   ```bash
   npm run build
   ```

   Cela créera un dossier `out/` avec tous les fichiers statiques.

3. **Uploader les fichiers**

   - Connectez-vous à votre cPanel Hostinger
   - Allez dans "File Manager"
   - Naviguez vers `public_html` (ou le dossier de votre domaine)
   - Supprimez les fichiers existants (sauf `.htaccess` si nécessaire)
   - Uploader tout le contenu du dossier `out/`

4. **Configurer `.htaccess` pour le routing**

   Créez/modifiez `.htaccess` dans `public_html` :

   ```apache
   RewriteEngine On
   RewriteBase /

   # Redirection HTTPS
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

   # Redirection www vers non-www (ou inversement selon votre préférence)
   RewriteCond %{HTTP_HOST} ^www\.theschoolofmathematics\.com [NC]
   RewriteRule ^(.*)$ https://theschoolofmathematics.com/$1 [L,R=301]

   # Gestion des routes Next.js
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]

   # Cache des assets statiques
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType image/webp "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
   </IfModule>

   # Compression Gzip
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
   </IfModule>
   ```

---

## Option 2: Node.js Hosting (Si disponible)

Si votre plan Hostinger inclut Node.js :

1. **Préparer le build**

   ```bash
   npm run build
   ```

2. **Créer `package.json` pour la production**

   Assurez-vous que `package.json` contient :

   ```json
   {
     "scripts": {
       "start": "next start -p 3000"
     }
   }
   ```

3. **Uploader les fichiers**

   Via FTP ou File Manager, uploader :
   - Tout le contenu du projet (sauf `node_modules`)
   - Le dossier `.next` (généré par `npm run build`)

4. **Installer les dépendances sur le serveur**

   Via SSH ou le terminal Node.js de Hostinger :

   ```bash
   npm install --production
   ```

5. **Démarrer l'application**

   Via le panneau Node.js de Hostinger, configurez :
   - **Start Command**: `npm start`
   - **Port**: `3000` (ou celui fourni par Hostinger)

6. **Configurer le domaine**

   Dans cPanel, configurez votre domaine pour pointer vers l'application Node.js.

---

## Option 3: VPS Hostinger

Si vous avez un VPS Hostinger, vous pouvez déployer comme un serveur classique :

1. **Se connecter en SSH**

   ```bash
   ssh root@votre-ip-hostinger
   ```

2. **Installer Node.js 18+**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Installer PM2**

   ```bash
   npm install -g pm2
   ```

4. **Cloner votre projet**

   ```bash
   git clone votre-repo-url
   cd quizz
   ```

5. **Créer le fichier `.env`**

   ```bash
   nano .env
   ```

   Ajouter :
   ```
   NEXT_PUBLIC_SITE_URL=https://theschoolofmathematics.com
   WORDPRESS_API_URL=https://votre-backend-wordpress.com
   ```

6. **Installer et build**

   ```bash
   npm install
   npm run build
   ```

7. **Démarrer avec PM2**

   ```bash
   pm2 start npm --name "theschoolofmathematics" -- start
   pm2 save
   pm2 startup
   ```

8. **Configurer Nginx**

   Créer `/etc/nginx/sites-available/theschoolofmathematics.com` :

   ```nginx
   server {
       listen 80;
       server_name theschoolofmathematics.com www.theschoolofmathematics.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

9. **Activer et SSL**

   ```bash
   sudo ln -s /etc/nginx/sites-available/theschoolofmathematics.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d theschoolofmathematics.com -d www.theschoolofmathematics.com
   ```

---

## 📝 Configuration pour Export Statique

Si vous choisissez l'Option 1 (Export Statique), modifiez `next.config.js` :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Active l'export statique
  reactStrictMode: true,
  images: {
    unoptimized: true, // Nécessaire pour l'export statique
    domains: [
      'theschoolofmathematics.com',
      'www.theschoolofmathematics.com',
      process.env.WORDPRESS_API_URL?.replace('https://', '').replace('http://', '').split('/')[0] || ''
    ].filter(Boolean),
  },
  // ... reste de votre configuration
}

module.exports = nextConfig
```

**Note importante** : L'export statique signifie que :
- ✅ Pas besoin de serveur Node.js
- ✅ Fonctionne sur n'importe quel hébergement web
- ❌ Pas de Server-Side Rendering (SSR)
- ❌ Pas de routes API Next.js
- ⚠️ Les appels API WordPress doivent être faits côté client uniquement

---

## 🔧 Configuration DNS sur Hostinger

1. **Connectez-vous à votre cPanel Hostinger**
2. **Allez dans "Zone Editor" ou "DNS Zone"**
3. **Configurez les enregistrements** :

   Pour le domaine principal :
   ```
   Type: A
   Name: @
   Value: IP de votre serveur Hostinger
   TTL: 3600
   ```

   Pour www :
   ```
   Type: CNAME
   Name: www
   Value: theschoolofmathematics.com
   TTL: 3600
   ```

---

## 📦 Structure des fichiers à uploader

### Pour Export Statique (Option 1) :
```
public_html/
├── .htaccess
├── index.html
├── _next/
│   ├── static/
│   └── ...
├── quiz/
├── about-us/
├── contact-us/
└── ... (tous les fichiers du dossier out/)
```

### Pour Node.js (Option 2) :
```
votre-dossier-nodejs/
├── .next/
├── public/
├── src/
├── package.json
├── next.config.js
└── .env
```

---

## ✅ Checklist Déploiement Hostinger

- [ ] Choisir la méthode de déploiement (Statique recommandé)
- [ ] Modifier `next.config.js` si export statique
- [ ] Build du projet : `npm run build`
- [ ] Créer/modifier `.htaccess` pour le routing
- [ ] Uploader les fichiers via File Manager ou FTP
- [ ] Configurer les DNS dans cPanel
- [ ] Tester le site : https://theschoolofmathematics.com
- [ ] Vérifier que toutes les pages se chargent
- [ ] Tester les liens et la navigation
- [ ] Vérifier HTTPS (SSL)

---

## 🆘 Dépannage

### Erreur 404 sur les routes
- Vérifier que `.htaccess` est correctement configuré
- Vérifier que les fichiers sont dans le bon dossier

### Images ne se chargent pas
- Vérifier que `images.unoptimized: true` est dans `next.config.js`
- Vérifier les chemins des images

### Erreurs de build
- Vérifier que toutes les dépendances sont installées
- Vérifier les variables d'environnement

### Site ne se charge pas
- Vérifier les permissions des fichiers (755 pour dossiers, 644 pour fichiers)
- Vérifier les logs d'erreur dans cPanel

---

## 📞 Support Hostinger

Si vous rencontrez des problèmes :
- Consulter la documentation Hostinger
- Contacter le support Hostinger
- Vérifier les logs dans cPanel > Error Logs

---

## 🎯 Recommandation

Pour Hostinger, je recommande **l'Option 1 (Export Statique)** car :
- ✅ Simple et rapide
- ✅ Fonctionne avec tous les plans Hostinger
- ✅ Pas besoin de configuration serveur complexe
- ✅ Performances excellentes
- ✅ Coût réduit

C'est la méthode la plus adaptée pour un site Next.js sur un hébergement web classique.





