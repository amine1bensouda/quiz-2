import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import { getUserActiveSubscription } from '@/lib/subscription-access';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/me/subscription
 *
 * Renvoie l'abonnement qui donne réellement accès au contenu (même règles que
 * getUserActiveSubscription), avec le cours pour SINGLE_COURSE — pas une ligne
 * "incomplete" après abandon du Checkout.
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

    const active = await getUserActiveSubscription(user.id);
    if (!active) {
      return addResponseObservability(
        NextResponse.json({ subscription: null }),
        startTime,
        '/api/users/me/subscription'
      );
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: active.id },
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
