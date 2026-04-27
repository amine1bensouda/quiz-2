import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/subscriptions
 * Liste les abonnements avec filtre optionnel `status` et `plan`.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error('Erreur récupération abonnements admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: error.message },
      { status: 500 }
    );
  }
}
