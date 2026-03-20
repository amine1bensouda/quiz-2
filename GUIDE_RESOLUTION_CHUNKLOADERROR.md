# 🔧 Guide de Résolution - ChunkLoadError

## ❌ Erreur

```
ChunkLoadError: Loading chunk app/quiz/[slug]/page failed.
(timeout: http://localhost:3000/_next/static/chunks/app/quiz/%5Bslug%5D/page.js)
```

## 🔍 Causes Possibles

1. **Cache corrompu** : Le dossier `.next` contient des fichiers corrompus
2. **Serveur de développement arrêté** : Le serveur Next.js n'est pas démarré
3. **Port occupé** : Un autre processus utilise le port 3000
4. **Problème de build** : Erreur lors de la compilation
5. **Fichiers manquants** : Fichiers JavaScript non générés correctement

## ✅ Solutions

### Solution 1 : Nettoyer le Cache et Redémarrer (Recommandé)

```powershell
# 1. Arrêter tous les processus Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Supprimer le cache .next
Remove-Item -Path ".next" -Recurse -Force

# 3. Redémarrer le serveur
npm run dev
```

### Solution 2 : Nettoyer Complètement

```powershell
# 1. Arrêter tous les processus Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Supprimer le cache .next
Remove-Item -Path ".next" -Recurse -Force

# 3. Supprimer node_modules/.cache si présent
if (Test-Path "node_modules/.cache") {
    Remove-Item -Path "node_modules/.cache" -Recurse -Force
}

# 4. Redémarrer le serveur
npm run dev
```

### Solution 3 : Vérifier le Port

Si le port 3000 est occupé :

```powershell
# Vérifier quel processus utilise le port 3000
netstat -ano | findstr :3000

# Arrêter le processus si nécessaire
# (Remplacez PID par le numéro du processus)
taskkill /PID <PID> /F

# Redémarrer le serveur
npm run dev
```

### Solution 4 : Rebuild Complet

```powershell
# 1. Arrêter le serveur
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Nettoyer
Remove-Item -Path ".next" -Recurse -Force

# 3. Rebuild
npm run build

# 4. Redémarrer en mode développement
npm run dev
```

### Solution 5 : Vérifier les Erreurs de Build

Si le problème persiste, vérifiez s'il y a des erreurs de compilation :

```powershell
# Lancer le build pour voir les erreurs
npm run build
```

## 🚀 Solution Rapide (Une Ligne)

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force; Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue; npm run dev
```

## 📝 Vérifications

### 1. Vérifier que le Serveur Tourne

Ouvrez votre navigateur et allez sur :
```
http://localhost:3000
```

Vous devriez voir la page d'accueil.

### 2. Vérifier la Console du Navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Vérifiez s'il y a d'autres erreurs

### 3. Vérifier les Logs du Serveur

Dans le terminal où `npm run dev` tourne, vérifiez :
- Des erreurs de compilation
- Des warnings
- Des messages de succès

## ⚠️ Si le Problème Persiste

### 1. Vérifier la Version de Next.js

```powershell
npm list next
```

Si la version est ancienne (comme indiqué dans l'erreur : "Next.js (14.2.35) is outdated"), mettez à jour :

```powershell
npm install next@latest
```

### 2. Vérifier les Dépendances

```powershell
# Réinstaller les dépendances
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path "package-lock.json" -Force
npm install
```

### 3. Vérifier le Fichier de Configuration

Vérifiez que `next.config.js` n'a pas d'erreurs :

```powershell
# Vérifier la syntaxe
node -c next.config.js
```

### 4. Vérifier les Fichiers Modifiés Récemment

Si vous avez modifié des fichiers juste avant l'erreur :
- Vérifiez la syntaxe
- Vérifiez les imports
- Vérifiez les erreurs de linting

## 🔄 Prévention

Pour éviter ce problème à l'avenir :

1. **Arrêtez toujours proprement le serveur** : Utilisez `Ctrl+C` au lieu de fermer le terminal
2. **Nettoyez régulièrement** : Supprimez `.next` si vous avez des problèmes
3. **Mettez à jour Next.js** : Gardez Next.js à jour
4. **Vérifiez les erreurs de build** : Corrigez les erreurs de compilation rapidement

## 💡 Astuce

Si vous travaillez sur plusieurs projets Next.js, utilisez des ports différents :

```powershell
# Utiliser le port 3001
npm run dev -- -p 3001
```

## 📞 Besoin d'Aide ?

Si aucune de ces solutions ne fonctionne :

1. Vérifiez les logs complets du serveur
2. Vérifiez la console du navigateur pour d'autres erreurs
3. Vérifiez que tous les fichiers sont sauvegardés
4. Essayez de redémarrer votre ordinateur
