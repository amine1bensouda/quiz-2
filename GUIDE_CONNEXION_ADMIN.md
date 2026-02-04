# 🔐 Guide de Connexion Admin

## Mot de passe par défaut

Le mot de passe administrateur par défaut est : **`admin123`**

## Comment se connecter

1. Allez sur `http://localhost:3000/admin/login`
2. Entrez le mot de passe : **`admin123`**
3. Cliquez sur "Se connecter"

## Changer le mot de passe admin

Pour changer le mot de passe admin, ajoutez cette ligne dans votre fichier `.env.local` :

```env
ADMIN_PASSWORD=votre_nouveau_mot_de_passe_securise
```

⚠️ **Important** : Changez le mot de passe par défaut en production !

## Résolution de problèmes

### "Mot de passe incorrect"

1. Vérifiez que vous utilisez bien `admin123` (sans espaces)
2. Vérifiez que le fichier `.env.local` existe et contient `ADMIN_PASSWORD` si vous l'avez modifié
3. Redémarrez le serveur de développement (`npm run dev`)

### Le serveur ne démarre pas

Assurez-vous que :
- PostgreSQL (Supabase) est accessible
- La variable `DATABASE_URL` est correctement configurée dans `.env.local`
- Aucun autre processus Node.js n'utilise le port 3000
