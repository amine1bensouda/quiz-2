import bcrypt from 'bcryptjs';

/**
 * Hash un mot de passe (bcryptjs = JS pur, pas de binaire natif → fonctionne sur Vercel)
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return Promise.resolve(bcrypt.hashSync(password, saltRounds));
}

/**
 * Compare un mot de passe avec un hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return Promise.resolve(bcrypt.compareSync(password, hash));
}

/**
 * Génère un token de session simple (pour développement)
 * En production, utiliser JWT ou NextAuth.js
 */
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
