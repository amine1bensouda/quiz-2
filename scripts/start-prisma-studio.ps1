# Script PowerShell pour lancer Prisma Studio avec le bon chemin de base de données
$ErrorActionPreference = "Stop"

# Aller dans le répertoire du projet
Set-Location $PSScriptRoot\..

# Résoudre le chemin absolu de la base de données
$dbPath = Resolve-Path "prisma\dev.db" -ErrorAction Stop
$databaseUrl = "file:$dbPath"

Write-Host "🚀 Lancement de Prisma Studio..." -ForegroundColor Cyan
Write-Host "📁 Base de données: $dbPath" -ForegroundColor Gray
Write-Host "🔗 DATABASE_URL: $databaseUrl" -ForegroundColor Gray
Write-Host ""

# Définir la variable d'environnement et lancer Prisma Studio
$env:DATABASE_URL = $databaseUrl
npx prisma studio
