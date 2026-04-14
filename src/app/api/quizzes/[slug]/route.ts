import { NextRequest, NextResponse } from 'next/server';
import { getQuizBySlug } from '@/lib/quiz-service';
import { withCacheHeaders } from '@/lib/http-cache';
import { addResponseObservability } from '@/lib/traffic-guard';


export const revalidate = 3600; // Revalider toutes les heures

/**
 * GET /api/quizzes/[slug]
 * Récupère un quiz spécifique par son slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now();
  try {
    const quiz = await getQuizBySlug(params.slug);

    if (!quiz) {
      return addResponseObservability(NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      ), startTime, '/api/quizzes/[slug]');
    }

    return addResponseObservability(withCacheHeaders(NextResponse.json(quiz), {
      sMaxAge: 300,
      staleWhileRevalidate: 3600,
      maxAge: 60,
    }), startTime, '/api/quizzes/[slug]');
  } catch (error) {
    console.error(`Erreur API quiz ${params.slug}:`, error);
    return addResponseObservability(NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    ), startTime, '/api/quizzes/[slug]');
  }
}
