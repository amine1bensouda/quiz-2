import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/me/subscription
 *
 * Renvoie l'abonnement actif (ou le plus récent) de l'utilisateur courant
 * avec le cours associé (pour le plan SINGLE_COURSE).
 */
export async function GET() {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/users/me/subscription'
      );
    }

    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return addResponseObservability(
      NextResponse.json({ subscription: sub ?? null }),
      startTime,
      '/api/users/me/subscription'
    );
  } catch (error: any) {
    console.error('Error loading user subscription:', error);
    return addResponseObservability(
      NextResponse.json(
        { error: error?.message || 'Failed to load subscription' },
        { status: 500 }
      ),
      startTime,
      '/api/users/me/subscription'
    );
  }
}
