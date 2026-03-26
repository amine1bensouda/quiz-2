import { NextRequest, NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { getAllQuiz, getQuizList } from '@/lib/quiz-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * GET /api/quizzes
 * Récupère tous les quiz
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl ?? new URL(request.url);
    const moduleSlug = url.searchParams.get('module');
    const limitParam = url.searchParams.get('limit');
    const full = isFullRequest(request);
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Mode léger par défaut pour réduire egress DB. `full=1` garde l’ancien comportement.
    if (!full) {
      const quizzes = await getQuizList({
        moduleSlug: moduleSlug || undefined,
        limit,
      });
      return NextResponse.json(quizzes);
    }

    let quizzes = await getAllQuiz();

    // Filtrer par module si demandé
    if (moduleSlug) {
      quizzes = quizzes.filter((q) => {
        const fromCategory = String(q.acf?.categorie || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-');
        const fromCategories = Array.isArray(q.categories) ? q.categories : [];
        return fromCategory === moduleSlug || fromCategories.includes(moduleSlug);
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
