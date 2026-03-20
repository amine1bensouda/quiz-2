# Guide de Migration vers PostgreSQL

## 📋 Prérequis

1. Base PostgreSQL créée et accessible
2. Variables d'environnement configurées
3. Accès à la base de données

## 🔄 Étapes de Migration

### 1. Sauvegarder les données SQLite (si nécessaire)

```bash
# Exporter les données depuis SQLite
sqlite3 prisma/dev.db .dump > backup.sql
```

### 2. Configurer PostgreSQL

Créez une base de données PostgreSQL :

```sql
CREATE DATABASE quiz_db;
CREATE USER quiz_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE quiz_db TO quiz_user;
```

### 3. Configurer DATABASE_URL

Dans votre fichier `.env.local` ou variables d'environnement :

```env
DATABASE_URL="postgresql://quiz_user:votre_mot_de_passe@localhost:5432/quiz_db?sslmode=require"
```

### 4. Remplacer le schéma Prisma

```bash
# Option 1: Renommer le fichier
mv prisma/schema.prisma prisma/schema.sqlite.prisma
mv prisma/schema.postgresql.prisma prisma/schema.prisma

# Option 2: Modifier directement schema.prisma
# Changez provider de "sqlite" à "postgresql"
```

### 5. Générer le client Prisma

```bash
npx prisma generate
```

### 6. Créer les migrations

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name init_postgresql

# Ou pour la production
npx prisma migrate deploy
```

### 7. Vérifier la migration

```bash
# Ouvrir Prisma Studio pour vérifier
npx prisma studio
```

## ⚠️ Notes Importantes

- Les données SQLite ne peuvent pas être directement importées dans PostgreSQL
- Vous devrez peut-être réimporter les données manuellement ou créer un script de migration
- Testez toujours en environnement de développement avant la production

## 🔄 Rollback (si nécessaire)

Si vous devez revenir à SQLite :

```bash
mv prisma/schema.prisma prisma/schema.postgresql.prisma
mv prisma/schema.sqlite.prisma prisma/schema.prisma
npx prisma generate
```
