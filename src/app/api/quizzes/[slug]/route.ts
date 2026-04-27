import { NextRequest, NextResponse } from 'next/server';
import { getPublicQuizBySlug } from '@/lib/quiz-service';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { withCacheHeaders, withNoStoreHeaders } from '@/lib/http-cache';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
// Doit rester dynamique : la réponse dépend de la session utilisateur
// (verrouillage des questions pour les quiz payants non achetés).
export const dynamic = 'force-dynamic';

/**
 * GET /api/quizzes/[slug]
 * Récupère un quiz public. Pour les quiz payants non achetés, les questions
 * et réponses sont omises et le flag `isLocked` est renvoyé.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    const quiz = await getPublicQuizBySlug(params.slug, user?.id ?? null);

    if (!quiz) {
      return addResponseObservability(
        NextResponse.json({ error: 'Quiz not found' }, { status: 404 }),
        startTime,
        '/api/quizzes/[slug]'
      );
    }

    // Quiz payant + non acheté : jamais mis en cache partagé
    // (sinon une réponse verrouillée pourrait être servie à un utilisateur
    // ayant acheté, ou l'inverse).
    if (quiz.isLocked) {
      return addResponseObservability(
        withNoStoreHeaders(NextResponse.json(quiz)),
        startTime,
        '/api/quizzes/[slug]'
      );
    }

    return addResponseObservability(
      withCacheHeaders(NextResponse.json(quiz), {
        sMaxAge: 300,
        staleWhileRevalidate: 3600,
        maxAge: 60,
      }),
      startTime,
      '/api/quizzes/[slug]'
    );
  } catch (error) {
    console.error(`Erreur API quiz ${params.slug}:`, error);
    return addResponseObservability(
      NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 }),
      startTime,
      '/api/quizzes/[slug]'
    );
  }
}
