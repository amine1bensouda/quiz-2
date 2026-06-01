import { classifyPrismaError } from '@/lib/sync/db-error-message';
import { isSafeModeEnabled } from '@/lib/runtime-flags';

export function getAdminDashboardFallbackMessage(
  lastError: unknown | null
): string {
  if (isSafeModeEnabled()) {
    return 'SAFE_MODE=1 dans .env : certaines requêtes sont désactivées. Retirez SAFE_MODE puis redémarrez l’app.';
  }

  if (lastError) {
    const kind = classifyPrismaError(lastError);
    if (kind === 'missing_migration') {
      return 'Schéma Prisma non à jour sur le serveur. Exécutez : npx prisma migrate deploy puis rebuild + pm2 restart.';
    }
    if (kind === 'auth') {
      return 'Connexion PostgreSQL refusée pour une requête du dashboard. Vérifiez DATABASE_URL dans .env.';
    }
  }

  return 'Une requête du dashboard a échoué. Consultez pm2 logs ou appliquez les migrations Prisma.';
}
