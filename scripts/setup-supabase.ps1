# Script PowerShell pour configurer Supabase
# Usage: .\scripts\setup-supabase.ps1

Write-Host "🚀 Configuration Supabase - Guide étape par étape" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

Write-Host "📋 ÉTAPE 1: Vérification des fichiers..." -ForegroundColor Yellow

# Vérifier si le schéma PostgreSQL existe
if (-not (Test-Path "prisma/schema.postgresql.prisma")) {
    Write-Host "❌ Erreur: prisma/schema.postgresql.prisma n'existe pas" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Schéma PostgreSQL trouvé" -ForegroundColor Green

# Vérifier si le schéma actuel est SQLite
$currentSchema = Get-Content "prisma/schema.prisma" -Raw
if ($currentSchema -match 'provider = "sqlite"') {
    Write-Host "✅ Schéma SQLite détecté" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 ÉTAPE 2: Sauvegarde du schéma SQLite..." -ForegroundColor Yellow
    
    if (Test-Path "prisma/schema.sqlite.prisma") {
        Write-Host "⚠️  schema.sqlite.prisma existe déjà. Voulez-vous le remplacer? (O/N)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -ne "O" -and $response -ne "o") {
            Write-Host "❌ Opération annulée" -ForegroundColor Red
            exit 1
        }
    }
    
    Copy-Item "prisma/schema.prisma" "prisma/schema.sqlite.prisma" -Force
    Write-Host "✅ Schéma SQLite sauvegardé dans schema.sqlite.prisma" -ForegroundColor Green
} else {
    Write-Host "⚠️  Le schéma actuel n'est pas SQLite. Continuer quand même? (O/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "O" -and $response -ne "o") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 ÉTAPE 3: Migration vers PostgreSQL..." -ForegroundColor Yellow

Copy-Item "prisma/schema.postgresql.prisma" "prisma/schema.prisma" -Force
Write-Host "✅ Schéma PostgreSQL activé" -ForegroundColor Green

Write-Host ""
Write-Host "📋 ÉTAPE 4: Vérification du fichier .env.local..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local n'existe pas" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Création du fichier .env.local..." -ForegroundColor Yellow
    
    $databaseUrl = Read-Host "Entrez votre DATABASE_URL Supabase (postgresql://postgres:password@host:5432/postgres?sslmode=require)"
    
    $envContent = @"
# Base de données Supabase (PostgreSQL)
DATABASE_URL="$databaseUrl"

# URL du site (développement)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Environnement
NODE_ENV=development

# WordPress (si vous l'utilisez encore)
WORDPRESS_API_URL=http://localhost/test2/wp-json/tutor/v1
"@
    
    Set-Content -Path ".env.local" -Value $envContent
    Write-Host "✅ Fichier .env.local créé" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local existe déjà" -ForegroundColor Green
    
    # Vérifier si DATABASE_URL est configurée
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -notmatch 'DATABASE_URL=') {
        Write-Host "⚠️  DATABASE_URL n'est pas définie dans .env.local" -ForegroundColor Yellow
        $databaseUrl = Read-Host "Entrez votre DATABASE_URL Supabase"
        Add-Content -Path ".env.local" -Value "`nDATABASE_URL=`"$databaseUrl`""
        Write-Host "✅ DATABASE_URL ajoutée" -ForegroundColor Green
    } else {
        Write-Host "✅ DATABASE_URL est déjà configurée" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📋 ÉTAPE 5: Génération du client Prisma..." -ForegroundColor Yellow
Write-Host "⏳ Cela peut prendre 30-60 secondes..." -ForegroundColor Gray

try {
    npx prisma generate
    Write-Host "✅ Client Prisma généré avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 ÉTAPE 6: Création des tables dans Supabase..." -ForegroundColor Yellow
Write-Host "⏳ Connexion à Supabase et création des tables..." -ForegroundColor Gray

Write-Host ""
Write-Host "⚠️  ATTENTION: Cette étape va créer les tables dans votre base Supabase." -ForegroundColor Yellow
Write-Host "Voulez-vous continuer? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -ne "O" -and $response -ne "o") {
    Write-Host "❌ Opération annulée" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Pour créer les tables plus tard, exécutez:" -ForegroundColor Cyan
    Write-Host "   npx prisma db push" -ForegroundColor White
    exit 0
}

try {
    npx prisma db push
    Write-Host "✅ Tables créées dans Supabase avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la création des tables" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Vérifiez:" -ForegroundColor Cyan
    Write-Host "   1. Votre DATABASE_URL dans .env.local est correcte" -ForegroundColor White
    Write-Host "   2. Votre projet Supabase n'est pas en pause" -ForegroundColor White
    Write-Host "   3. Votre mot de passe est correct" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🎉 Configuration terminée avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifiez vos tables avec: npx prisma studio" -ForegroundColor White
Write-Host "   2. Redémarrez votre serveur: npm run dev" -ForegroundColor White
Write-Host "   3. Testez votre application sur http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation complète: GUIDE_ETAPE_PAR_ETAPE.md" -ForegroundColor Cyan
