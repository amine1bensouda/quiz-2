import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Route API pour forcer la revalidation du cache ISR
 * 
 * Usage:
 * POST /api/revalidate
 * Body: { "path": "/quiz", "secret": "your-secret" }
 * 
 * Pour utiliser cette route, ajoutez REVALIDATE_SECRET dans vos variables d'environnement Vercel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, secret } = body;

    // Vérifier le secret pour la sécurité (optionnel mais recommandé)
    if (process.env.REVALIDATE_SECRET && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { message: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalider les chemins principaux
    if (path) {
      revalidatePath(path);
    } else {
      // Revalider tous les chemins importants
      revalidatePath('/quiz');
      revalidatePath('/');
      revalidatePath('/api/courses');
    }

    return NextResponse.json({
      revalidated: true,
      path: path || 'all',
      now: Date.now(),
    });
  } catch (err) {
    console.error('Erreur revalidation:', err);
    return NextResponse.json(
      { message: 'Error revalidating', error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
