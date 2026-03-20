# Déploiement sur Hostinger

Ce guide explique comment faire passer le **build** et le déploiement sur Hostinger.

## Pourquoi le build échoue

Lors du `npm run build`, Next.js pré-génère des pages et exécute du code qui a besoin :

1. **De la base de données** → variable `DATABASE_URL` obligatoire pendant le build.
2. **De ne pas appeler localhost** → si `WORDPRESS_API_URL` n’est pas définie, l’app n’appellera plus `http://localhost/...` en production (évite les 404 pendant le build).

## 1. Variables d’environnement pendant le build

Sur Hostinger, les variables d’environnement doivent être définies **pour le build**, pas seulement au runtime.

- Dans le panneau Hostinger (hPanel), ouvrez **Avancé** → **Variables d’environnement** (ou l’équivalent pour votre hébergement Node/Next).
- Ajoutez au minimum :

| Variable            | Obligatoire | Description |
|---------------------|------------|-------------|
| `DATABASE_URL`      | **Oui**    | URL PostgreSQL (ex. Supabase, Neon ou BDD Hostinger). Format : `postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require` |
| `NEXT_PUBLIC_SITE_URL` | **Oui** | URL publique du site, sans slash final (ex. `https://votredomaine.com`) |
| `ADMIN_PASSWORD`    | Recommandé | Mot de passe de l’admin (pour `/admin/login`) |
| `WORDPRESS_API_URL`| Optionnel  | Uniquement si vous utilisez WordPress/Tutor. En production, mettez l’URL réelle (ex. `https://votresite.com`). **Ne pas laisser vide si vous voulez des quiz/catégories WordPress.** Si non définie, l’app n’appellera pas localhost pendant le build. |

Sans `DATABASE_URL` pendant le build, vous verrez :

```text
Environment variable not found: DATABASE_URL
PrismaClientInitializationError
```

## 2. Fichier .env sur le serveur

- Si Hostinger utilise un fichier `.env` à la racine du projet, copiez le contenu de `env.hostinger.example` vers `.env`.
- Remplissez les valeurs (surtout `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`).
- Vérifiez que ce `.env` est bien pris en compte **au moment du build** (selon la doc Hostinger).

## 3. Base de données

- Utilisez une base **PostgreSQL** (Supabase, Neon, ou PostgreSQL Hostinger).
- Après déploiement, exécutez les migrations Prisma sur cette base (en local avec `DATABASE_URL` pointant vers la BDD de prod, ou via un script/CI) :
  ```bash
  npx prisma migrate deploy
  ```
  ou
  ```bash
  npx prisma db push
  ```

## 4. Résumé des erreurs courantes

| Erreur | Cause | Solution |
|--------|--------|----------|
| `Environment variable not found: DATABASE_URL` | Variable absente pendant le build | Définir `DATABASE_URL` dans les variables d’environnement du build Hostinger |
| `AxiosError 404` vers `localhost/test2/wp-json/...` | Appel WordPress en build sans URL configurée | Définir `WORDPRESS_API_URL` avec l’URL réelle en prod, ou laisser non définie (l’app n’appellera plus localhost en prod) |
| `FATAL: MaxClientsInSessionMode: max clients reached` | Trop de connexions PostgreSQL au build | Déployer la version avec `connection_limit=1` (automatique) et pages en `dynamic` pour limiter la pré-génération. |
| `Échec de la compilation du déploiement` | Souvent une des causes ci-dessus | Vérifier les variables et relancer le déploiement après mise à jour du code |

## 5. Vérification

Après avoir configuré les variables :

1. Relancez un déploiement (build).
2. Si le build réussit mais que le site ne charge pas les données, vérifiez que `DATABASE_URL` est aussi disponible au **runtime** (pas seulement au build).
3. Consultez les logs de build Hostinger pour toute autre erreur.

---

Voir aussi `env.hostinger.example` pour la liste complète des variables possibles.
