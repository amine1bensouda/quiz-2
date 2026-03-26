import { NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { getAllCategories } from '@/lib/quiz-service';
import { _getAllCategoriesUncached } from '@/lib/wordpress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const full = isFullRequest(request);
    // Léger par défaut depuis Prisma; fallback WordPress uniquement si demandé.
    const categories = full
      ? await _getAllCategoriesUncached()
      : await getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur API categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

