# 🚀 Guide Rapide - Voir l'Affichage

## Étapes pour voir votre site en local

### 1️⃣ Installer les dépendances

Ouvrez un terminal dans le dossier `quizz` et exécutez :

```bash
npm install
```

⏱️ Cela prendra 2-5 minutes la première fois.

### 2️⃣ Créer le fichier de configuration

Créez un fichier `.env.local` à la racine du projet avec ce contenu (pour tester sans WordPress) :

```env
WORDPRESS_API_URL=http://localhost
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
NEXT_REVALIDATE_TIME=3600
```

> **Note** : Même sans WordPress configuré, le site s'affichera avec des messages "Aucun quiz disponible".

### 3️⃣ Lancer le serveur de développement

```bash
npm run dev
```

Vous verrez un message comme :
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### 4️⃣ Ouvrir dans le navigateur

Ouvrez votre navigateur et allez sur :

**http://localhost:3000**

🎉 Vous devriez voir votre site !

## 📱 Pages disponibles

- **http://localhost:3000** - Page d'accueil
- **http://localhost:3000/quiz** - Liste de tous les quiz
- **http://localhost:3000/a-propos** - Page À propos
- **http://localhost:3000/quiz/[slug]** - Page d'un quiz (nécessite des quiz dans WordPress)

## ⚠️ Si vous voyez "Aucun quiz disponible"

C'est normal ! Le site fonctionne, mais il n'y a pas encore de quiz dans WordPress.

Pour voir des quiz :
1. Configurez WordPress selon `WORDPRESS_SETUP.md`
2. Créez quelques quiz de test
3. Mettez à jour `.env.local` avec votre URL WordPress :
   ```env
   WORDPRESS_API_URL=https://admin.votresite.com
   ```

## 🛑 Arrêter le serveur

Dans le terminal, appuyez sur `Ctrl + C`

## 🔄 Redémarrer après modification

Le serveur se recharge automatiquement quand vous modifiez les fichiers. Si besoin :

```bash
# Arrêter (Ctrl + C)
# Puis relancer
npm run dev
```

## 🐛 Problèmes courants

### Erreur "Port 3000 already in use"

Le port 3000 est déjà utilisé. Changez le port :

```bash
npm run dev -- -p 3001
```

Puis ouvrez http://localhost:3001

### Erreur "Cannot find module"

Réinstallez les dépendances :

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur TypeScript

Vérifiez que TypeScript est installé :

```bash
npm install -g typescript
```








