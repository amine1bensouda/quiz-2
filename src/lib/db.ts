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

// En production (Vercel, Hostinger, Supabase/Neon), ajuster le pool de connexions
// connection_limit=5 : suffisant pour les requêtes parallèles (dashboard fait 4 requêtes en Promise.all)
// pool_timeout=30 : éviter les timeouts sur cold starts Vercel
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.startsWith('postgres')) {
  const url = process.env.DATABASE_URL;
  const params: string[] = [];
  if (!url.includes('connection_limit=')) {
    params.push('connection_limit=5');
  }
  if (!url.includes('pool_timeout=')) {
    params.push('pool_timeout=30');
  }
  if (!url.includes('connect_timeout=')) {
    params.push('connect_timeout=30');
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
