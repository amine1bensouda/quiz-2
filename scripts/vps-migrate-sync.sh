#!/usr/bin/env bash
# Base PostgreSQL déjà remplie (VPS) : baseline P3005 + colonnes sync.
# Usage : cd /var/www/quizz && chmod +x scripts/vps-migrate-sync.sh && ./scripts/vps-migrate-sync.sh

set -euo pipefail

cd "$(dirname "$0")/.."

BASELINE=(
  20260128163701_init
  20260130093218_add_course_status
  20260202081428_add_user_and_quiz_attempt
  20260512100000_quiz_order_in_module
)

SYNC_MIGRATION=20260601120000_quiz_sync_to_free
SYNC_SQL="prisma/migrations/${SYNC_MIGRATION}/migration.sql"

echo "==> 1/3 Baseline : migrations historiques déjà en base"
for name in "${BASELINE[@]}"; do
  echo "    resolve --applied $name"
  npx prisma migrate resolve --applied "$name" || true
done

echo "==> 2/3 SQL sync (sync_publish_status, sync_logs…) — idempotent"
if [ ! -f "$SYNC_SQL" ]; then
  echo "Fichier introuvable: $SYNC_SQL"
  exit 1
fi
npx prisma db execute --file "$SYNC_SQL" --schema prisma/schema.prisma

echo "==> 3/3 Enregistrer la migration sync"
npx prisma migrate resolve --applied "$SYNC_MIGRATION" || true

echo ""
npx prisma migrate status || true
npm run health:db

echo ""
echo "Terminé. Lancez : npm run build && pm2 restart quizz"
