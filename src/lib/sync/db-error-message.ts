export type DbErrorKind =
  | 'auth'
  | 'connection'
  | 'missing_migration'
  | 'unknown';

export type DbErrorInfo = {
  kind: DbErrorKind;
  message: string;
  hints: string[];
};

function isMissingSchemaError(msg: string): boolean {
  return (
    msg.includes('does not exist') ||
    msg.includes('sync_logs') ||
    msg.includes('sync_publish_status') ||
    msg.includes('source_quiz_id') ||
    msg.includes('Unknown column') ||
    msg.includes('column') && msg.includes('not exist')
  );
}

function isSupabaseHost(): boolean {
  const url = process.env.DATABASE_URL || '';
  return url.includes('supabase.com') || url.includes('supabase.co');
}

export function classifyPrismaError(error: unknown): DbErrorKind {
  if (!(error instanceof Error)) return 'unknown';
  const msg = error.message;
  if (msg.includes('P1000') || msg.includes('Authentication failed')) return 'auth';
  if (isMissingSchemaError(msg)) return 'missing_migration';
  if (
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('connect')
  ) {
    return 'connection';
  }
  return 'unknown';
}

export function formatPrismaDbError(error: unknown): DbErrorInfo {
  const kind = classifyPrismaError(error);
  const raw = error instanceof Error ? error.message : '';

  if (kind === 'missing_migration') {
    return {
      kind,
      message:
        'Schéma Prisma non aligné : colonnes/tables de sync manquantes sur ce serveur.',
      hints: [
        'Sur le VPS : cd /var/www/quizz && git pull',
        'chmod +x scripts/vps-migrate-sync.sh && ./scripts/vps-migrate-sync.sh',
        'npm run build && pm2 restart quizz',
        'npm run health:db',
      ],
    };
  }

  if (kind === 'auth') {
    return {
      kind,
      message:
        'PostgreSQL a refusé la connexion. Vérifiez DATABASE_URL et DIRECT_URL dans le fichier .env du serveur.',
      hints: [
        'Utilisateur, mot de passe et nom de base (ex. quizdb / school_db)',
        'Sur VPS : postgresql://USER:PASS@localhost:5432/NOM_BASE',
        'Caractères spéciaux dans le mot de passe : les encoder en URL (%21 pour !)',
        'Test : npm run health:db',
      ],
    };
  }

  if (kind === 'connection') {
    const hints = [
      'PostgreSQL démarré : sudo systemctl status postgresql',
      'DATABASE_URL pointe vers la bonne base sur ce serveur (souvent localhost:5432)',
      'Test : npm run health:db',
    ];
    if (isSupabaseHost()) {
      hints.unshift(
        'Projet Supabase actif (non en pause) — URL dans Settings → Database'
      );
    }
    return {
      kind,
      message: 'Impossible de joindre le serveur PostgreSQL.',
      hints,
    };
  }

  return {
    kind: 'unknown',
    message: raw || 'Erreur lors de l’accès à la base de données.',
    hints: [
      'Consulter les logs : pm2 logs',
      'Vérifier DATABASE_URL dans .env',
      'npx prisma migrate deploy puis redémarrer l’app',
    ],
  };
}
