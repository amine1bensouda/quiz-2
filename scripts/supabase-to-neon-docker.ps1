#Requires -Version 5.1
<#
.SYNOPSIS
  Exporte les donnees (schema public) depuis Supabase et les importe dans Neon via Docker (pg_dump + psql).

.DESCRIPTION
  - Ne migre que les DONNEES (--data-only). Le schema doit deja exister sur Neon (ex. npx prisma db push).
  - Utilise l'image officielle postgres:16 (pg_dump / psql).
  - Les URLs sont passees au conteneur via un fichier --env-file temporaire (evite les soucis avec & et les guillemets PowerShell).

.PARAMETER SkipPull
  Ne pas executer docker pull (plus rapide si l'image est deja presente).

.PARAMETER DisableFkChecks
  Active session_replication_role = replica pendant l'import (utile si erreurs de cles etrangeres a l'ordre des COPY).

.PARAMETER EnvFile
  Fichier .env a lire pour remplir NEON_DIRECT_URL (cle DIRECT_URL) ou SUPABASE_DIRECT_URL si les variables ne sont pas deja definies.
  Par defaut : racine du projet + .env (si le fichier existe).

.EXAMPLE
  $env:SUPABASE_DIRECT_URL = "postgresql://postgres:MDP@db.xxx.supabase.co:5432/postgres"
  $env:NEON_DIRECT_URL    = "postgresql://user:MDP@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
  powershell -ExecutionPolicy Bypass -File .\scripts\supabase-to-neon-docker.ps1

.EXAMPLE
  # Neon lu depuis .env (DIRECT_URL), Supabase uniquement en variable :
  $env:SUPABASE_DIRECT_URL = "postgresql://..."
  powershell -ExecutionPolicy Bypass -File .\scripts\supabase-to-neon-docker.ps1
#>

param(
  [switch] $SkipPull,
  [switch] $DisableFkChecks,
  [string] $EnvFile = ""
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dumpName = "data-supabase-to-neon.sql"
$dumpFile = Join-Path $root $dumpName

function Get-DotEnvValue {
  param([string] $FilePath, [string] $Key)
  if (-not (Test-Path -LiteralPath $FilePath)) { return $null }
  foreach ($line in Get-Content -LiteralPath $FilePath -Encoding UTF8) {
    $t = $line.Trim()
    if ($t.Length -eq 0 -or $t.StartsWith("#")) { continue }
    $prefix = "$Key="
    if (-not $t.StartsWith($prefix)) { continue }
    $v = $t.Substring($prefix.Length).Trim()
    if (
      ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) -or
      ($v.Length -ge 2 -and $v.StartsWith("'") -and $v.EndsWith("'"))
    ) {
      $v = $v.Substring(1, $v.Length - 2)
    }
    return $v
  }
  return $null
}

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
  $EnvFile = Join-Path $root ".env"
}

if ([string]::IsNullOrWhiteSpace($env:NEON_DIRECT_URL)) {
  $fromEnv = Get-DotEnvValue -FilePath $EnvFile -Key "DIRECT_URL"
  if (-not [string]::IsNullOrWhiteSpace($fromEnv)) {
    $env:NEON_DIRECT_URL = $fromEnv
    Write-Host "NEON_DIRECT_URL charge depuis $EnvFile (DIRECT_URL)."
  }
}
$envLocalPath = Join-Path $root ".env.local"
if ([string]::IsNullOrWhiteSpace($env:NEON_DIRECT_URL) -and (Test-Path -LiteralPath $envLocalPath)) {
  $fromLocal = Get-DotEnvValue -FilePath $envLocalPath -Key "DIRECT_URL"
  if (-not [string]::IsNullOrWhiteSpace($fromLocal)) {
    $env:NEON_DIRECT_URL = $fromLocal
    Write-Host "NEON_DIRECT_URL charge depuis .env.local (DIRECT_URL)."
  }
}

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DIRECT_URL)) {
  $fromEnv = Get-DotEnvValue -FilePath $EnvFile -Key "SUPABASE_DIRECT_URL"
  if (-not [string]::IsNullOrWhiteSpace($fromEnv)) {
    $env:SUPABASE_DIRECT_URL = $fromEnv
    Write-Host "SUPABASE_DIRECT_URL charge depuis $EnvFile."
  }
}
if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DIRECT_URL) -and (Test-Path -LiteralPath $envLocalPath)) {
  $fromLocal = Get-DotEnvValue -FilePath $envLocalPath -Key "SUPABASE_DIRECT_URL"
  if (-not [string]::IsNullOrWhiteSpace($fromLocal)) {
    $env:SUPABASE_DIRECT_URL = $fromLocal
    Write-Host "SUPABASE_DIRECT_URL charge depuis .env.local."
  }
}

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DIRECT_URL)) {
  Write-Error @"
Variable SUPABASE_DIRECT_URL manquante.
Definissez l'URL directe Supabase, par exemple :
  `$env:SUPABASE_DIRECT_URL = "postgresql://postgres:MDP@db.xxx.supabase.co:5432/postgres"
Ou ajoutez dans .env (non versionne) :
  SUPABASE_DIRECT_URL=postgresql://...
"@
}

if ([string]::IsNullOrWhiteSpace($env:NEON_DIRECT_URL)) {
  Write-Error @"
Variable NEON_DIRECT_URL manquante.
Utilisez l'URL DIRECTE Neon (sans -pooler), comme DIRECT_URL dans .env, ou definissez :
  `$env:NEON_DIRECT_URL = "postgresql://neondb_owner:...@ep-xxx....neon.tech/neondb?sslmode=require"
"@
}

# Docker Desktop (Windows) : chemins avec slashs pour le montage de volume
$rootMount = $root -replace "\\", "/"

Write-Host "Racine projet : $root"
Write-Host "Dump           : $dumpFile"

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker n'est pas disponible. Demarrez Docker Desktop, attendez qu'il soit pret, puis relancez ce script."
}

if (-not $SkipPull) {
  Write-Host "Telechargement de l'image postgres:16..."
  docker pull postgres:16
  if ($LASTEXITCODE -ne 0) {
    Write-Error "docker pull postgres:16 a echoue. Verifiez la connexion reseau et Docker."
  }
}

if (Test-Path -LiteralPath $dumpFile) {
  Remove-Item -LiteralPath $dumpFile -Force
  Write-Host "Ancien dump supprime."
}

# Fichiers env temporaires : evite les problemes PowerShell avec & dans les query strings
$envDump = Join-Path $env:TEMP ("quiz-migrate-pgdump-{0}.env" -f [Guid]::NewGuid().ToString("n"))
$envPsql = Join-Path $env:TEMP ("quiz-migrate-psql-{0}.env" -f [Guid]::NewGuid().ToString("n"))

try {
  Set-Content -LiteralPath $envDump -Value ("PGDUMPURL={0}" -f $env:SUPABASE_DIRECT_URL) -Encoding utf8 -NoNewline
  Set-Content -LiteralPath $envPsql -Value ("PSQLURL={0}" -f $env:NEON_DIRECT_URL) -Encoding utf8 -NoNewline
} catch {
  Write-Error "Impossible d'ecrire les fichiers env temporaires : $_"
}

try {
  Write-Host "Export Supabase (schema public, --data-only)..."

  docker run --rm `
    -v "${rootMount}:/migrate" `
    --env-file "$envDump" `
    postgres:16 `
    sh -c 'pg_dump "$PGDUMPURL" --data-only --no-owner --no-acl --schema=public -f /migrate/data-supabase-to-neon.sql'

  if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump a echoue (code $LASTEXITCODE). Verifiez SUPABASE_DIRECT_URL et l'acces reseau a Supabase."
  }

  if (-not (Test-Path -LiteralPath $dumpFile)) {
    Write-Error "Fichier dump introuvable : $dumpFile"
  }

  $size = (Get-Item -LiteralPath $dumpFile).Length
  if ($size -lt 200) {
    Write-Warning "Le dump est tres petit ($size octets). Verifiez que la base Supabase contient bien des donnees dans le schema public."
  } else {
    Write-Host "Dump OK ($size octets)."
  }

  Write-Host "Import dans Neon..."

  if ($DisableFkChecks) {
    docker run --rm `
      -v "${rootMount}:/migrate" `
      --env-file "$envPsql" `
      postgres:16 `
      sh -c 'psql "$PSQLURL" -v ON_ERROR_STOP=1 -c "SET session_replication_role = replica;" -f /migrate/data-supabase-to-neon.sql -c "SET session_replication_role = origin;"'
  } else {
    docker run --rm `
      -v "${rootMount}:/migrate" `
      --env-file "$envPsql" `
      postgres:16 `
      sh -c 'psql "$PSQLURL" -v ON_ERROR_STOP=1 -f /migrate/data-supabase-to-neon.sql'
  }

  if ($LASTEXITCODE -ne 0) {
    Write-Error @"
psql import a echoue (code $LASTEXITCODE).
Verifiez NEON_DIRECT_URL (connexion directe, pas le pooler) et le contenu du dump.
Si vous voyez des erreurs de contrainte (foreign key), relancez avec :
  -DisableFkChecks
"@
  }

  Write-Host "Termine. Verifiez les tables dans le tableau Neon."
} finally {
  Remove-Item -LiteralPath $envDump -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $envPsql -Force -ErrorAction SilentlyContinue
}
