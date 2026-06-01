export function formatPrismaDbError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('P1000') || error.message.includes('Authentication failed')) {
      return (
        'Authentification PostgreSQL refusée.\n' +
        'Vérifiez utilisateur, mot de passe et nom de la base dans DATABASE_URL.'
      );
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('tenant')) {
      return (
        'Serveur PostgreSQL introuvable ou projet Supabase invalide / en pause.\n' +
        'Mettez à jour DATABASE_URL depuis le tableau de bord Supabase (Settings → Database).'
      );
    }
    if (error.message.includes('sync_logs') || error.message.includes('does not exist')) {
      return (
        'Tables de sync absentes.\n' +
        'Exécutez : npx prisma migrate deploy'
      );
    }
    return error.message;
  }
  return 'Erreur de connexion à la base de données.';
}
