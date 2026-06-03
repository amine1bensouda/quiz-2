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
        'Prisma schema is out of sync: sync columns/tables are missing on this server.',
      hints: [
        'On the VPS: cd /var/www/quizz && git pull',
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
        'PostgreSQL rejected the connection. Check DATABASE_URL and DIRECT_URL in the server .env file.',
      hints: [
        'Verify username, password, and database name (e.g. quizdb / school_db)',
        'On VPS: postgresql://USER:PASS@localhost:5432/DB_NAME',
        'Special characters in password must be URL-encoded (%21 for !)',
        'Test: npm run health:db',
      ],
    };
  }

  if (kind === 'connection') {
    const hints = [
      'PostgreSQL is running: sudo systemctl status postgresql',
      'DATABASE_URL points to the correct database on this server (usually localhost:5432)',
      'Test: npm run health:db',
    ];
    if (isSupabaseHost()) {
      hints.unshift(
        'Supabase project is active (not paused) - check URL in Settings -> Database'
      );
    }
    return {
      kind,
      message: 'Unable to reach the PostgreSQL server.',
      hints,
    };
  }

  return {
    kind: 'unknown',
    message: raw || 'Error while accessing the database.',
    hints: [
      'Check logs: pm2 logs',
      'Verify DATABASE_URL in .env',
      'Run npx prisma migrate deploy, then restart the app',
    ],
  };
}
