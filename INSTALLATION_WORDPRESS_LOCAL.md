# 📦 Installation WordPress en Local (XAMPP) - Guide Rapide

## 🎯 Objectif

Installer WordPress dans un dossier `admin` pour qu'il soit accessible sur `http://localhost/admin` et serve de backend pour votre plateforme de quiz.

## 📋 Étapes d'Installation

### 1️⃣ Préparer XAMPP

1. Ouvrez le **Panneau de contrôle XAMPP**
2. Démarrez **Apache** et **MySQL** (cliquez sur "Start")
3. Vérifiez que les deux services sont en vert ✅

### 2️⃣ Télécharger WordPress

Vous avez déjà `wordpress-6.2.zip` dans `C:\xampp\htdocs\`

**OU** téléchargez la dernière version :
- Allez sur https://wordpress.org/download/
- Téléchargez la version française

### 3️⃣ Extraire WordPress

1. Allez dans `C:\xampp\htdocs\`
2. **Créez un dossier** nommé `admin` (s'il n'existe pas)
3. **Extrayez** le contenu de `wordpress-6.2.zip` dans `C:\xampp\htdocs\admin\`
   - Le dossier `admin` doit contenir les fichiers WordPress (wp-config.php, wp-admin, wp-content, etc.)

### 4️⃣ Créer la Base de Données

1. Ouvrez votre navigateur
2. Allez sur **http://localhost/phpmyadmin**
3. Cliquez sur **"Nouvelle base de données"** (ou "New" en haut à gauche)
4. Nommez-la : `wordpress_quiz` (ou un nom de votre choix)
5. Choisissez **utf8mb4_unicode_ci** comme interclassement
6. Cliquez sur **"Créer"**

### 5️⃣ Installer WordPress

1. Ouvrez votre navigateur
2. Allez sur **http://localhost/admin**
3. Vous verrez l'écran d'installation WordPress

**Informations à renseigner :**

- **Langue** : Français
- **Titre du site** : "Plateforme de Quiz - Admin"
- **Nom d'utilisateur** : Choisissez un nom (ex: `admin`)
- **Mot de passe** : Créez un mot de passe fort (⚠️ **Notez-le quelque part !**)
- **Email** : Votre email
- **Base de données** : `wordpress_quiz` (ou le nom que vous avez choisi)
- **Identifiant** : `root` (par défaut XAMPP)
- **Mot de passe** : (laissez vide, c'est la valeur par défaut XAMPP)
- **Adresse de la base de données** : `localhost`
- **Préfixe de table** : `wp_` (par défaut)

4. Cliquez sur **"Installer WordPress"**

### 6️⃣ Se Connecter

Une fois l'installation terminée :

1. Allez sur **http://localhost/admin/wp-admin**
2. Connectez-vous avec :
   - **Nom d'utilisateur** : Celui que vous avez créé
   - **Mot de passe** : Celui que vous avez défini

🎉 **Félicitations !** Vous êtes maintenant dans l'interface WordPress !

## ✅ Vérification

Une fois connecté, vous devriez voir :

- Le **tableau de bord WordPress**
- Le menu latéral avec toutes les options
- La barre d'administration en haut

## 🔧 Configuration pour Next.js

Maintenant, mettez à jour votre fichier `.env.local` dans le projet Next.js :

```env
WORDPRESS_API_URL=http://localhost/admin
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
NEXT_REVALIDATE_TIME=3600
```

## 🧪 Tester l'API WordPress

Pour vérifier que l'API fonctionne, ouvrez dans votre navigateur :

**http://localhost/admin/wp-json/wp/v2/**

Vous devriez voir une réponse JSON avec les endpoints disponibles.

## 📝 Prochaines Étapes

Maintenant que WordPress est installé :

1. ✅ Installez les plugins requis (voir `WORDPRESS_SETUP.md`)
2. ✅ Configurez les Custom Post Types
3. ✅ Configurez Advanced Custom Fields
4. ✅ Testez la connexion avec Next.js

## 🐛 Problèmes Courants

### Erreur "Erreur de connexion à la base de données"

**Solution :**
- Vérifiez que MySQL est démarré dans XAMPP
- Vérifiez que la base de données existe dans phpMyAdmin
- Vérifiez les identifiants dans `wp-config.php`

### Page blanche après installation

**Solution :**
- Vérifiez les permissions des fichiers
- Activez l'affichage des erreurs dans `wp-config.php`

### WordPress ne se charge pas

**Solution :**
- Vérifiez que Apache est démarré
- Vérifiez que les fichiers sont bien dans `C:\xampp\htdocs\admin\`
- Vérifiez l'URL : doit être `http://localhost/admin` (pas `/admin/`)

---

💡 **Astuce** : Gardez XAMPP ouvert et les services Apache/MySQL démarrés pendant que vous travaillez sur votre projet.








