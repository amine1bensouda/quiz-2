import { NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { getAllCategories } from '@/lib/quiz-service';
import { _getAllCategoriesUncached } from '@/lib/wordpress';
import { withCacheHeaders, withNoStoreHeaders } from '@/lib/http-cache';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    const full = isFullRequest(request);
    // Léger par défaut depuis Prisma; fallback WordPress uniquement si demandé.
    const categories = full
      ? await _getAllCategoriesUncached()
      : await getAllCategories();
    if (full) {
      return addResponseObservability(
        withNoStoreHeaders(NextResponse.json(categories)),
        startTime,
        '/api/categories'
      );
    }
    return addResponseObservability(withCacheHeaders(NextResponse.json(categories), {
      sMaxAge: 300,
      staleWhileRevalidate: 3600,
      maxAge: 60,
    }), startTime, '/api/categories');
  } catch (error) {
    console.error('Erreur API categories:', error);
    return addResponseObservability(
      NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 }),
      startTime,
      '/api/categories'
    );
  }
}

