import { NextRequest, NextResponse } from 'next/server';
import { getQuizBySlug } from '@/lib/quiz-service';

export const revalidate = 3600; // Revalider toutes les heures

/**
 * GET /api/quizzes/[slug]
 * Récupère un quiz spécifique par son slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const quiz = await getQuizBySlug(params.slug);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error(`Erreur API quiz ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
