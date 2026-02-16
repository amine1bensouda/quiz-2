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

// En production (Vercel + Supabase), limiter les connexions pour éviter "max clients reached"
if (process.env.VERCEL && process.env.DATABASE_URL?.startsWith('postgres')) {
  const url = process.env.DATABASE_URL;
  if (!url.includes('connection_limit=')) {
    process.env.DATABASE_URL = url.includes('?')
      ? `${url}&connection_limit=1`
      : `${url}?connection_limit=1`;
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
