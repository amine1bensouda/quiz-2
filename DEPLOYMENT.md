# Guide de Déploiement - Hostinger

Ce guide vous explique comment déployer votre application Next.js sur Hostinger.

## 📋 Prérequis

- Compte Hostinger avec accès SSH
- WordPress déjà installé sur `admin.votresite.com`
- Node.js 18+ installé sur le serveur (vérifier avec `node --version`)

## 🔧 Configuration Initiale

### 1. Connexion SSH

```bash
ssh u123456789@votresite.com
# Entrer le mot de passe fourni par Hostinger
```

### 2. Navigation vers le dossier web

```bash
cd /home/u123456789/public_html
```

### 3. Installation de Node.js (si nécessaire)

Si Node.js n'est pas installé, utilisez NodeSource :

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 🚀 Installation de l'Application

### 1. Cloner ou transférer les fichiers

Si vous avez déjà les fichiers localement :

```bash
# Depuis votre machine locale
scp -r quizz/ u123456789@votresite.com:/home/u123456789/public_html/
```

Ou créer directement sur le serveur :

```bash
cd /home/u123456789/public_html
# Créer le dossier
mkdir nextjs-app
cd nextjs-app
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer le fichier `.env.local` :

```bash
nano .env.local
```

Contenu :

```env
WORDPRESS_API_URL=https://admin.votresite.com
NEXT_PUBLIC_SITE_URL=https://www.votresite.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
NEXT_REVALIDATE_TIME=3600
```

Sauvegarder avec `Ctrl+X`, puis `Y`, puis `Enter`.

## 🏗️ Build de Production

### 1. Build de l'application

```bash
npm run build
```

Cette commande va :
- Générer toutes les pages statiques
- Optimiser les images
- Créer les fichiers de production dans `.next/`

### 2. Vérifier le build

```bash
npm start
```

Tester sur `http://votresite.com:3000` (si le port est ouvert)

## 🌐 Configuration du Domaine

### Option 1 : Utiliser le port 3000 (non recommandé)

Si Hostinger permet d'ouvrir des ports personnalisés, vous pouvez utiliser PM2 pour gérer le processus.

### Option 2 : Reverse Proxy avec Apache (Recommandé)

Configurer Apache pour rediriger vers Next.js :

1. **Créer un fichier de configuration Apache**

```bash
sudo nano /etc/apache2/sites-available/nextjs.conf
```

2. **Configuration (si Next.js tourne sur localhost:3000)**

```apache
<VirtualHost *:80>
    ServerName www.votresite.com
    ServerAlias votresite.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

3. **Activer le site**

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2ensite nextjs
sudo systemctl restart apache2
```

### Option 3 : Utiliser PM2 (Recommandé pour production)

1. **Installer PM2**

```bash
npm install -g pm2
```

2. **Démarrer l'application avec PM2**

```bash
cd /home/u123456789/public_html/nextjs-app
pm2 start npm --name "quiz-platform" -- start
pm2 save
pm2 startup
```

3. **Commandes PM2 utiles**

```bash
pm2 list              # Voir les processus
pm2 logs quiz-platform # Voir les logs
pm2 restart quiz-platform # Redémarrer
pm2 stop quiz-platform    # Arrêter
```

## 🔄 Mise à Jour

Pour mettre à jour l'application :

```bash
cd /home/u123456789/public_html/nextjs-app
git pull  # Si vous utilisez Git
# Ou transférer les nouveaux fichiers
npm install  # Si de nouvelles dépendances
npm run build
pm2 restart quiz-platform
```

## 📊 Monitoring

### Vérifier les logs

```bash
pm2 logs quiz-platform
```

### Vérifier l'utilisation des ressources

```bash
pm2 monit
```

## 🔒 Sécurité

1. **Ne pas exposer le dossier `.next`** dans les fichiers publics
2. **Protéger le fichier `.env.local`** (déjà dans `.gitignore`)
3. **Configurer un firewall** si possible
4. **Utiliser HTTPS** (certificat SSL via Hostinger)

## ⚠️ Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs quiz-platform --lines 50

# Vérifier que le port 3000 est libre
netstat -tulpn | grep 3000

# Vérifier les variables d'environnement
cat .env.local
```

### Erreur de connexion à WordPress

- Vérifier que l'URL WordPress est correcte
- Vérifier que CORS est configuré dans WordPress
- Tester l'API : `curl https://admin.votresite.com/wp-json/wp/v2/quiz`

### Pages 404

- Vérifier que le build s'est bien passé
- Vérifier que les slugs WordPress correspondent
- Regénérer les pages : `npm run build`

## 📝 Checklist de Déploiement

- [ ] Node.js 18+ installé
- [ ] Fichiers transférés sur le serveur
- [ ] Dépendances installées (`npm install`)
- [ ] Variables d'environnement configurées (`.env.local`)
- [ ] Build réussi (`npm run build`)
- [ ] Application démarrée avec PM2
- [ ] Reverse proxy configuré (si nécessaire)
- [ ] HTTPS activé
- [ ] Test de l'application en production
- [ ] Monitoring configuré

## 🎯 Optimisations Post-Déploiement

1. **Activer le cache CDN Hostinger** (si disponible)
2. **Configurer la compression Gzip** (déjà dans Next.js)
3. **Optimiser les images** (Sharp est déjà installé)
4. **Configurer Google Analytics** (si souhaité)
5. **Soumettre le sitemap à Google Search Console**

