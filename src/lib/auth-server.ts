import { cookies, headers } from 'next/headers';
import { prisma } from './db';
import { parseSessionToken } from './session-token';

/**
 * Lit le token depuis Authorization Bearer (mobile) ou cookie (web).
 */
export async function getSessionTokenFromRequest(): Promise<string | undefined> {
  try {
    const headerStore = await headers();
    const authorization = headerStore.get('authorization');
    if (authorization?.toLowerCase().startsWith('bearer ')) {
      const bearer = authorization.slice(7).trim();
      if (bearer) return bearer;
    }

    const cookieStore = await cookies();
    return cookieStore.get('session_token')?.value;
  } catch (error) {
    console.error('Error reading session token:', error);
    return undefined;
  }
}

/**
 * Récupère l'utilisateur à partir d'un session token (sans appeler cookies()).
 * Utilisé par les route handlers qui appellent cookies() eux-mêmes en premier.
 */
export async function getUserBySessionToken(sessionToken: string | undefined) {
  const parsed = parseSessionToken(sessionToken);
  if (!parsed) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Récupère l'utilisateur actuel depuis cookie ou Bearer token.
 */
export async function getCurrentUserFromSession() {
  try {
    const sessionToken = await getSessionTokenFromRequest();
    return getUserBySessionToken(sessionToken);
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function requireAuth() {
  const user = await getCurrentUserFromSession();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
