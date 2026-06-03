import { classifyPrismaError } from '@/lib/sync/db-error-message';
import { isSafeModeEnabled } from '@/lib/runtime-flags';

export function getAdminDashboardFallbackMessage(
  lastError: unknown | null
): string {
  if (isSafeModeEnabled()) {
    return 'SAFE_MODE=1 in .env: some queries are disabled. Remove SAFE_MODE and restart the app.';
  }

  if (lastError) {
    const kind = classifyPrismaError(lastError);
    if (kind === 'missing_migration') {
      return 'Prisma schema is not up to date on the server. Run: npx prisma migrate deploy, then rebuild + pm2 restart.';
    }
    if (kind === 'auth') {
      return 'PostgreSQL connection was rejected for a dashboard query. Check DATABASE_URL in .env.';
    }
  }

  return 'A dashboard query failed. Check pm2 logs or apply Prisma migrations.';
}
