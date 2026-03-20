# Script pour résoudre l'erreur EPERM de Prisma
# Usage: .\scripts\fix-prisma-eperm.ps1

Write-Host "🔧 Résolution de l'erreur EPERM Prisma..." -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter tous les processus Node.js
Write-Host "1️⃣ Arrêt des processus Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ $($nodeProcesses.Count) processus Node.js arrêtés" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️ Aucun processus Node.js trouvé" -ForegroundColor Gray
}

# 2. Supprimer le dossier .prisma
Write-Host ""
Write-Host "2️⃣ Nettoyage du cache Prisma..." -ForegroundColor Yellow
$prismaPath = "node_modules\.prisma"
if (Test-Path $prismaPath) {
    try {
        Remove-Item -Path $prismaPath -Recurse -Force -ErrorAction Stop
        Write-Host "   ✅ Cache Prisma supprimé" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Erreur lors de la suppression: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   💡 Essayez de fermer tous les éditeurs et terminaux, puis relancez ce script" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️ Pas de cache Prisma à supprimer" -ForegroundColor Gray
}

# 3. Régénérer le client Prisma
Write-Host ""
Write-Host "3️⃣ Régénération du client Prisma..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host ""
    Write-Host "✅ Client Prisma régénéré avec succès!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de la régénération: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Prêt! Vous pouvez maintenant lancer 'npm run dev'" -ForegroundColor Green
