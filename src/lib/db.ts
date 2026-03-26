import { PrismaClient } from '@prisma/client';
import { resolve } from 'path';

// SQLite : chemin absolu pour Prisma
if (process.env.DATABASE_URL?.startsWith('file:')) {
  let dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (!dbPath.startsWith('/') && !dbPath.match(/^[A-Z]:/)) {
    dbPath = resolve(process.cwd(), dbPath);
  }
  process.env.DATABASE_URL = `file:${dbPath}`;
}

function upsertQueryParam(url: string, key: string, value: string): string {
  const pattern = new RegExp(`([?&])${key}=[^&]*`);
  if (pattern.test(url)) {
    return url.replace(pattern, `$1${key}=${encodeURIComponent(value)}`);
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${key}=${encodeURIComponent(value)}`;
}

// PostgreSQL : pooler Supabase / Neon — éviter connection_limit=1 avec requêtes parallèles.
if (process.env.DATABASE_URL?.startsWith('postgres')) {
  let url = process.env.DATABASE_URL;
  const isSupabasePooler =
    url.includes(':6543/') ||
    url.includes('pooler.supabase.com') ||
    url.includes('pgbouncer=true');
  const isNeonPooler = url.includes('.pooler.') && url.includes('neon.tech');

  if (isSupabasePooler || isNeonPooler) {
    const limit = isSupabasePooler ? '1' : '10';
    url = upsertQueryParam(url, 'connection_limit', limit);
    url = upsertQueryParam(url, 'pool_timeout', '120');
    url = upsertQueryParam(url, 'connect_timeout', '40');
  } else {
    if (!/[?&]connection_limit=/.test(url)) {
      url = upsertQueryParam(url, 'connection_limit', '5');
    }
    if (!/[?&]pool_timeout=/.test(url)) {
      url = upsertQueryParam(url, 'pool_timeout', '30');
    }
    if (!/[?&]connect_timeout=/.test(url)) {
      url = upsertQueryParam(url, 'connect_timeout', '15');
    }
  }

  process.env.DATABASE_URL = url;
}

// MySQL (ex. Hostinger) : renforcer le pool si absent dans l’URL.
if (process.env.DATABASE_URL?.startsWith('mysql://')) {
  let url = process.env.DATABASE_URL;
  if (!/[?&]connection_limit=/.test(url)) {
    url = upsertQueryParam(url, 'connection_limit', '5');
  }
  if (!/[?&]pool_timeout=/.test(url)) {
    url = upsertQueryParam(url, 'pool_timeout', '45');
  }
  if (!/[?&]connect_timeout=/.test(url)) {
    url = upsertQueryParam(url, 'connect_timeout', '30');
  }
  process.env.DATABASE_URL = url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;
