import { NextRequest, NextResponse } from 'next/server';
import { getAllQuiz } from '@/lib/quiz-service';

export const revalidate = 3600; // Revalider toutes les heures

/**
 * GET /api/quizzes
 * Récupère tous les quiz
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleSlug = searchParams.get('module');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let quizzes = await getAllQuiz();

    // Filtrer par module si demandé
    if (moduleSlug) {
      quizzes = quizzes.filter((q) => {
        // Vérifier si le slug du module correspond
        const moduleSlugMatch = q.acf?.categorie === moduleSlug;
        // Ou vérifier dans les catégories (slugs convertis en nombres)
        const categoryMatch = q.categories && q.categories.length > 0;
        return moduleSlugMatch || false;
      });
    }

    // Limiter le nombre de résultats si demandé
    if (limit) {
      quizzes = quizzes.slice(0, limit);
    }

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Erreur API quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
