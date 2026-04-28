import { NextRequest, NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { getAllQuiz, getQuizList } from '@/lib/quiz-service';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getAccessibleQuizIds,
  stripQuizContentForPaywall,
} from '@/lib/subscription-access';
import { withCacheHeaders, withNoStoreHeaders } from '@/lib/http-cache';
import {
  addResponseObservability,
  checkRateLimit,
  getRequestIp,
  tooManyRequestsJson,
} from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * GET /api/quizzes
 * Récupère tous les quiz
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const url = request.nextUrl ?? new URL(request.url);
    const moduleSlug = url.searchParams
      .get('module')
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    const limitParam = url.searchParams.get('limit');
    const full = isFullRequest(request);
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const ip = getRequestIp(request);

    const rateKey = `api:quizzes:${ip}:${full ? 'full' : 'summary'}`;
    const rate = checkRateLimit(rateKey, full ? { windowMs: 60_000, max: 20 } : { windowMs: 60_000, max: 120 });
    if (!rate.allowed) {
      return addResponseObservability(
        tooManyRequestsJson(rate.retryAfter, 'Too many quiz requests'),
        startTime,
        '/api/quizzes'
      );
    }

    // Mode léger par défaut pour réduire egress DB. `full=1` garde l’ancien comportement.
    if (!full) {
      const quizzes = await getQuizList({
        moduleSlug: moduleSlug || undefined,
        limit,
      });
      const response = withCacheHeaders(NextResponse.json(quizzes), {
        sMaxAge: 300,
        staleWhileRevalidate: 3600,
        maxAge: 60,
      });
      response.headers.set('X-RateLimit-Remaining', String(rate.remaining));
      return addResponseObservability(response, startTime, '/api/quizzes');
    }

    let quizzes = await getAllQuiz();

    // Filtrer par module si demandé
    if (moduleSlug) {
      quizzes = quizzes.filter((q) => {
        const fromCategory = String(q.acf?.categorie || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-');
        const fromCategories = Array.isArray(q.categories)
          ? q.categories.map((value) =>
              String(value)
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
            )
          : [];
        return fromCategory === moduleSlug || fromCategories.includes(moduleSlug);
      });
    }

    // Limiter le nombre de résultats si demandé
    if (limit) {
      quizzes = quizzes.slice(0, limit);
    }

    // Mode full : la réponse contient les questions. On en retire le contenu
    // pour les quiz non couverts par l'abonnement de l'utilisateur courant.
    const user = await getCurrentUserFromSession();
    const isAdmin = await isAdminAuthenticated();
    const accessibleIds = await getAccessibleQuizIds(user?.id ?? null, isAdmin);
    quizzes = quizzes.map((q) => {
      if (accessibleIds === null) return { ...q, isLocked: false };
      if (q.prismaId && accessibleIds.has(q.prismaId)) {
        return { ...q, isLocked: false };
      }
      return { ...stripQuizContentForPaywall(q), isLocked: true };
    });

    const response = withNoStoreHeaders(NextResponse.json(quizzes));
    response.headers.set('X-RateLimit-Remaining', String(rate.remaining));
    return addResponseObservability(response, startTime, '/api/quizzes');
  } catch (error) {
    console.error('Erreur API quizzes:', error);
    return addResponseObservability(
      NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
      ),
      startTime,
      '/api/quizzes'
    );
  }
}

