import { NextResponse } from 'next/server';
import { unstable_noStore } from 'next/cache';
import { _getAllCategoriesUncached } from '@/lib/wordpress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  unstable_noStore();
  try {
    const categories = await _getAllCategoriesUncached();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur API categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

