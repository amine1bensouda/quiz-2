import { PrismaClient } from '@prisma/client';
import { resolve } from 'path';

// Corriger DATABASE_URL pour SQLite (chemin absolu)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
  let dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  // Si c'est un chemin relatif, le convertir en absolu
  if (!dbPath.startsWith('/') && !dbPath.match(/^[A-Z]:/)) {
    dbPath = resolve(process.cwd(), dbPath);
  }
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// Paramètres du pool Prisma pour PostgreSQL (Vercel serverless + Supabase)
// IMPORTANT : connection_limit=1 bloque Promise.all() (plusieurs findMany en parallèle)
// → timeout P2024. Avec le pooler Supabase (6543 + pgbouncer), plusieurs connexions
// côté Prisma sont multiplexées correctement.
if (process.env.DATABASE_URL?.startsWith('postgres')) {
  const url = process.env.DATABASE_URL;
  const isVercel = Boolean(process.env.VERCEL);
  const isSupabasePooler =
    url.includes(':6543/') ||
    url.includes('pooler.supabase.com') ||
    url.includes('pgbouncer=true');

  const params: string[] = [];
  if (!url.includes('connection_limit=')) {
    if (isVercel && isSupabasePooler) {
      params.push('connection_limit=10');
    } else if (isVercel) {
      params.push('connection_limit=5');
    } else {
      params.push('connection_limit=5');
    }
  }
  if (!url.includes('pool_timeout=')) {
    params.push(isVercel ? 'pool_timeout=60' : 'pool_timeout=30');
  }
  if (!url.includes('connect_timeout=')) {
    params.push(isVercel ? 'connect_timeout=30' : 'connect_timeout=15');
  }
  if (params.length > 0) {
    const separator = url.includes('?') ? '&' : '?';
    process.env.DATABASE_URL = `${url}${separator}${params.join('&')}`;
  }
}

// PrismaClient instancié une seule fois et réutilisé (dev + prod)
// Critique sur Vercel : éviter une nouvelle instance par requête → épuisement du pool DB
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;
