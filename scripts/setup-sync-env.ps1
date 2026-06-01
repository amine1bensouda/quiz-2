<#
.SYNOPSIS
  Génère les clés de sync premium → gratuit et les écrit dans les .env locaux.

.DESCRIPTION
  - quiz-main  : FREE_SITE_URL, FREE_SYNC_API_KEY, FREE_SYNC_HMAC_SECRET
  - the-school : SYNC_API_KEY, SYNC_HMAC_SECRET (mêmes valeurs)

.EXAMPLE
  # Afficher les clés sans modifier les fichiers
  .\scripts\setup-sync-env.ps1

.EXAMPLE
  # Écrire / mettre à jour les .env
  .\scripts\setup-sync-env.ps1 -Apply

.EXAMPLE
  # URL du site gratuit personnalisée
  .\scripts\setup-sync-env.ps1 -Apply -FreeSiteUrl "http://localhost:3002"
#>

param(
  [switch]$Apply,
  [string]$FreeSiteUrl = "http://localhost:3002",
  [string]$QuizMainRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$TheSchoolRoot = "C:\xampp\htdocs\the-school"
)

$ErrorActionPreference = "Stop"

function New-HexSecret {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return ([BitConverter]::ToString($bytes) -replace "-", "").ToLower()
}

function Update-EnvFile {
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][hashtable]$Variables
  )

  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  $lines = New-Object System.Collections.Generic.List[string]
  if (Test-Path $Path) {
    foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
      $lines.Add($line)
    }
  }

  foreach ($key in $Variables.Keys) {
    $value = $Variables[$key]
    $escaped = [regex]::Escape($key)
    $pattern = "^\s*$escaped\s*="
    $replaced = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -match $pattern) {
        $lines[$i] = "$key=$value"
        $replaced = $true
        break
      }
    }

    if (-not $replaced) {
      if ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -ne "") {
        $lines.Add("")
      }
      $lines.Add("# Sync premium → gratuit (généré par setup-sync-env.ps1)")
      $lines.Add("$key=$value")
    }
  }

  [System.IO.File]::WriteAllText($Path, ($lines -join [Environment]::NewLine) + [Environment]::NewLine)
}

$apiKey = New-HexSecret
$hmacSecret = New-HexSecret

$quizMainEnv = Join-Path $QuizMainRoot ".env"
$theSchoolEnv = Join-Path $TheSchoolRoot ".env"

Write-Host ""
Write-Host "=== Sync premium (quiz-main) -> gratuit (the-school) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "FREE_SITE_URL          = $FreeSiteUrl"
Write-Host "FREE_SYNC_API_KEY      = $apiKey"
Write-Host "FREE_SYNC_HMAC_SECRET  = $hmacSecret"
Write-Host ""
Write-Host "(the-school utilise SYNC_API_KEY et SYNC_HMAC_SECRET avec les memes valeurs)"
Write-Host ""

if (-not $Apply) {
  Write-Host "Mode apercu : aucun fichier modifie." -ForegroundColor Yellow
  Write-Host "Pour ecrire dans les .env :" -ForegroundColor Yellow
  Write-Host "  .\scripts\setup-sync-env.ps1 -Apply" -ForegroundColor Green
  Write-Host ""
  exit 0
}

if (-not (Test-Path $TheSchoolRoot)) {
  Write-Error "Dossier the-school introuvable : $TheSchoolRoot"
}

Update-EnvFile -Path $quizMainEnv -Variables @{
  FREE_SITE_URL         = $FreeSiteUrl.TrimEnd("/")
  FREE_SYNC_API_KEY     = $apiKey
  FREE_SYNC_HMAC_SECRET = $hmacSecret
}

Update-EnvFile -Path $theSchoolEnv -Variables @{
  SYNC_API_KEY     = $apiKey
  SYNC_HMAC_SECRET = $hmacSecret
}

Write-Host "Fichiers mis a jour :" -ForegroundColor Green
Write-Host "  $quizMainEnv"
Write-Host "  $theSchoolEnv"
Write-Host ""
Write-Host "Redemarrez les serveurs dev (quiz-main + the-school) puis testez la publication admin." -ForegroundColor Green
Write-Host ""
