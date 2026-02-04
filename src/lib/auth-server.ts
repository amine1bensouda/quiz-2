import { cookies } from 'next/headers';
import { prisma } from './db';

/**
 * Récupère l'utilisateur actuel depuis la session
 */
export async function getCurrentUserFromSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    // Extraire l'ID utilisateur du token (format: userId-timestamp)
    const userId = sessionToken.split('-')[0];

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
 * Vérifie si l'utilisateur est authentifié
 */
export async function requireAuth() {
  const user = await getCurrentUserFromSession();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
