#!/bin/bash

# Script pour configurer Supabase avec Prisma
# Usage: bash scripts/setup-supabase.sh

echo "🚀 Configuration Supabase pour Next.js"
echo "========================================"
echo ""

# Étape 1: Sauvegarder le schéma SQLite
echo "📦 Étape 1: Sauvegarde du schéma SQLite..."
if [ -f "prisma/schema.prisma" ]; then
    mv prisma/schema.prisma prisma/schema.sqlite.prisma
    echo "✅ Schéma SQLite sauvegardé dans prisma/schema.sqlite.prisma"
else
    echo "⚠️  Fichier schema.prisma non trouvé"
fi

# Étape 2: Utiliser le schéma PostgreSQL
echo ""
echo "📦 Étape 2: Migration vers PostgreSQL..."
if [ -f "prisma/schema.postgresql.prisma" ]; then
    cp prisma/schema.postgresql.prisma prisma/schema.prisma
    echo "✅ Schéma PostgreSQL copié"
else
    echo "❌ Fichier schema.postgresql.prisma non trouvé"
    echo "   Création du schéma PostgreSQL..."
    # Le fichier devrait déjà exister, mais au cas où
    exit 1
fi

# Étape 3: Vérifier que DATABASE_URL est configuré
echo ""
echo "📦 Étape 3: Vérification de DATABASE_URL..."
if grep -q "DATABASE_URL" .env.local 2>/dev/null; then
    echo "✅ DATABASE_URL trouvé dans .env.local"
else
    echo "⚠️  DATABASE_URL non trouvé dans .env.local"
    echo "   Veuillez ajouter:"
    echo "   DATABASE_URL=\"postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require\""
    exit 1
fi

# Étape 4: Générer le client Prisma
echo ""
echo "📦 Étape 4: Génération du client Prisma..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Client Prisma généré avec succès"
else
    echo "❌ Erreur lors de la génération du client Prisma"
    exit 1
fi

# Étape 5: Créer les tables
echo ""
echo "📦 Étape 5: Création des tables dans Supabase..."
echo "   Choisissez une option:"
echo "   1) npx prisma migrate dev (recommandé pour développement)"
echo "   2) npx prisma db push (plus rapide, pour tester)"
read -p "   Votre choix (1 ou 2): " choice

if [ "$choice" = "1" ]; then
    npx prisma migrate dev --name init_postgresql
elif [ "$choice" = "2" ]; then
    npx prisma db push
else
    echo "❌ Choix invalide"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "✅ Tables créées avec succès dans Supabase"
else
    echo "❌ Erreur lors de la création des tables"
    exit 1
fi

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "✅ Prochaines étapes:"
echo "   1. Vérifiez vos tables dans Supabase Dashboard → Database → Tables"
echo "   2. Testez avec: npm run build"
echo "   3. Démarrez le serveur: npm start"
echo ""
