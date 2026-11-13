import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';

/** Prefixe : 2 lettres (nom ou email), puis 6 chiffres. Ex. AM482917 */
export function buildOrderNumberPrefix(nameOrEmail: string): string {
  const source = (nameOrEmail || '').trim();
  const letters = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  if (letters.length >= 2) return letters.slice(0, 2);
  if (letters.length === 1) return `${letters}X`;
  return 'CT';
}

export function generateOrderNumber(nameOrEmail: string): string {
  const prefix = buildOrderNumberPrefix(nameOrEmail);
  const digits = String(randomInt(0, 1_000_000)).padStart(6, '0');
  return `${prefix}${digits}`;
}

/**
 * Crée un orderNumber unique (AM123456). Réessaie en cas de collision.
 */
export async function createUniqueOrderNumber(nameOrEmail: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generateOrderNumber(nameOrEmail);
    const existing = await prisma.subscription.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  // Fallback très improbable : prefix + timestamp partiel
  const prefix = buildOrderNumberPrefix(nameOrEmail);
  return `${prefix}${String(Date.now()).slice(-6)}`;
}
