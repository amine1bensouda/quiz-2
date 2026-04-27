import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { cancelPaypalSubscription } from '@/lib/paypal';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/paypal/cancel
 *
 * Annule l'abonnement PayPal actif de l'utilisateur courant.
 * PayPal bascule le plan en CANCELLED côté provider, puis envoie
 * un webhook `BILLING.SUBSCRIPTION.CANCELLED` qui finalise l'état local.
 */
export async function POST() {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/subscriptions/paypal/cancel'
      );
    }

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        provider: 'paypal',
        status: { in: ['trialing', 'active', 'past_due', 'incomplete'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub || !sub.providerSubscriptionId) {
      return addResponseObservability(
        NextResponse.json({ error: 'No active PayPal subscription' }, { status: 404 }),
        startTime,
        '/api/subscriptions/paypal/cancel'
      );
    }

    await cancelPaypalSubscription(sub.providerSubscriptionId);

    // Mise à jour optimiste : on attend tout de même le webhook pour le statut final.
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });

    return addResponseObservability(
      NextResponse.json({ success: true }),
      startTime,
      '/api/subscriptions/paypal/cancel'
    );
  } catch (error: any) {
    console.error('Error canceling PayPal subscription:', error);
    return addResponseObservability(
      NextResponse.json(
        { error: error?.message || 'Failed to cancel subscription' },
        { status: 500 }
      ),
      startTime,
      '/api/subscriptions/paypal/cancel'
    );
  }
}
