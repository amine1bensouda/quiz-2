# 🔐 Comment Accéder à l'Interface WordPress

Ce guide vous explique comment accéder au tableau de bord WordPress (wp-admin) selon votre configuration.

## 📍 Scénario 1 : WordPress en Local (XAMPP)

Si vous avez installé WordPress sur votre machine locale avec XAMPP :

### 1. Démarrer XAMPP

1. Ouvrez le **Panneau de contrôle XAMPP**
2. Démarrez **Apache** et **MySQL** (cliquez sur "Start")

### 2. Accéder à WordPress

Ouvrez votre navigateur et allez sur :

**http://localhost/votre-dossier-wordpress/wp-admin**

Exemples :
- Si WordPress est dans `htdocs/wordpress` → `http://localhost/wordpress/wp-admin`
- Si WordPress est dans `htdocs/wp` → `http://localhost/wp/wp-admin`
- Si WordPress est dans `htdocs/admin` → `http://localhost/admin/wp-admin`

### 3. Se connecter

- **Nom d'utilisateur** : Celui que vous avez créé lors de l'installation
- **Mot de passe** : Le mot de passe que vous avez défini

> 💡 **Si vous avez oublié vos identifiants**, vous pouvez les réinitialiser via la base de données MySQL ou utiliser la fonction "Mot de passe oublié" sur la page de connexion.

## 📍 Scénario 2 : WordPress sur Serveur Hostinger

Si WordPress est installé sur votre serveur Hostinger :

### 1. Accéder via le sous-domaine

Selon votre configuration, WordPress devrait être accessible sur :

**https://admin.votresite.com/wp-admin**

ou

**https://votresite.com/admin/wp-admin**

### 2. Se connecter

- Utilisez les identifiants que vous avez créés lors de l'installation WordPress
- Si vous avez installé WordPress via le panneau Hostinger, vérifiez vos emails pour les identifiants

## 📍 Scénario 3 : WordPress Non Installé

Si WordPress n'est pas encore installé, voici comment l'installer :

### Option A : Installation Locale avec XAMPP

1. **Télécharger WordPress**
   - Allez sur https://wordpress.org/download/
   - Téléchargez la dernière version

2. **Extraire dans XAMPP**
   - Extrayez le fichier ZIP dans `C:\xampp\htdocs\`
   - Renommez le dossier en `admin` ou `wordpress` (ex: `C:\xampp\htdocs\admin`)

3. **Créer la base de données**
   - Ouvrez http://localhost/phpmyadmin
   - Créez une nouvelle base de données (ex: `wordpress_quiz`)

4. **Installer WordPress**
   - Allez sur http://localhost/admin (ou le nom de votre dossier)
   - Suivez l'assistant d'installation
   - Utilisez les informations de la base de données créée

### Option B : Installation sur Hostinger

1. **Via le panneau Hostinger**
   - Connectez-vous à votre compte Hostinger
   - Allez dans "Sites Web" → "Gestionnaire WordPress"
   - Cliquez sur "Installer WordPress"
   - Choisissez un sous-domaine (ex: `admin.votresite.com`)

2. **Installation manuelle**
   - Téléchargez WordPress
   - Uploadez les fichiers via FTP dans un sous-dossier (ex: `/public_html/admin/`)
   - Créez une base de données MySQL
   - Suivez l'assistant d'installation

## 🔑 Récupérer les Identifiants

### Si vous avez oublié votre mot de passe :

1. **Via la page de connexion**
   - Allez sur `/wp-admin` ou `/wp-login.php`
   - Cliquez sur "Mot de passe oublié ?"
   - Entrez votre email ou nom d'utilisateur

2. **Via la base de données (avancé)**
   - Accédez à phpMyAdmin
   - Trouvez la table `wp_users`
   - Modifiez le mot de passe (utilisez MD5 pour le hash)

3. **Via FTP/SSH (avancé)**
   - Connectez-vous via FTP ou SSH
   - Modifiez le fichier `wp-config.php` pour ajouter un utilisateur admin temporaire

## ✅ Vérification de l'Installation

Une fois connecté, vous devriez voir :

- **Tableau de bord WordPress** avec les statistiques
- **Menu latéral** avec toutes les options (Articles, Pages, Extensions, etc.)
- **Barre d'administration** en haut de la page

## 🎯 Prochaines Étapes

Une fois connecté à WordPress :

1. ✅ Vérifiez que vous êtes bien connecté
2. 📦 Installez les plugins requis (voir `WORDPRESS_SETUP.md`)
3. ⚙️ Configurez les Custom Post Types
4. 🔧 Configurez Advanced Custom Fields
5. 🔗 Testez l'API REST : `http://localhost/votre-dossier/wp-json/wp/v2/`

## 🐛 Problèmes Courants

### Erreur "404 Not Found"

- Vérifiez que Apache est démarré dans XAMPP
- Vérifiez le chemin dans l'URL (doit correspondre au nom du dossier)
- Vérifiez que les fichiers WordPress sont bien dans `htdocs`

### Erreur "Erreur de connexion à la base de données"

- Vérifiez que MySQL est démarré dans XAMPP
- Vérifiez les identifiants dans `wp-config.php`
- Vérifiez que la base de données existe dans phpMyAdmin

### Page blanche

- Activez l'affichage des erreurs dans `wp-config.php` :
  ```php
  define('WP_DEBUG', true);
  define('WP_DEBUG_DISPLAY', true);
  ```

## 📝 URLs Utiles

- **Page de connexion** : `/wp-admin` ou `/wp-login.php`
- **Tableau de bord** : `/wp-admin`
- **API REST** : `/wp-json/wp/v2/`
- **Extensions** : `/wp-admin/plugins.php`
- **Thèmes** : `/wp-admin/themes.php`

---

💡 **Astuce** : Si vous travaillez en local, assurez-vous que votre fichier `.env.local` dans Next.js pointe vers la bonne URL WordPress :
```env
WORDPRESS_API_URL=http://localhost/admin
```








