#!/bin/bash
# Script bash pour lancer Prisma Studio avec le bon chemin de base de données

cd "$(dirname "$0")/.."

# Résoudre le chemin absolu de la base de données
DB_PATH=$(realpath prisma/dev.db)
DATABASE_URL="file:$DB_PATH"

echo "🚀 Lancement de Prisma Studio..."
echo "📁 Base de données: $DB_PATH"
echo "🔗 DATABASE_URL: $DATABASE_URL"
echo ""

# Définir la variable d'environnement et lancer Prisma Studio
export DATABASE_URL="$DATABASE_URL"
npx prisma studio
