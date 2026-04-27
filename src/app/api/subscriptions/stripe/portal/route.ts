import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/stripe/portal
 *
 * Ouvre une session Stripe Customer Billing Portal pour gérer/annuler
 * l'abonnement. Repose sur `providerCustomerId` stocké sur la Subscription.
 */
export async function POST() {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/subscriptions/stripe/portal'
      );
    }

    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id, provider: 'stripe' },
      orderBy: { createdAt: 'desc' },
      select: { providerCustomerId: true },
    });

    if (!sub?.providerCustomerId) {
      return addResponseObservability(
        NextResponse.json(
          { error: 'No Stripe customer on file. Start a subscription first.' },
          { status: 404 }
        ),
        startTime,
        '/api/subscriptions/stripe/portal'
      );
    }

    const appUrl =
      process.env.STRIPE_BILLING_PORTAL_RETURN_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000/dashboard';

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.providerCustomerId,
      return_url: appUrl,
    });

    return addResponseObservability(
      NextResponse.json({ url: portal.url }),
      startTime,
      '/api/subscriptions/stripe/portal'
    );
  } catch (error: any) {
    console.error('Error opening Stripe portal:', error);
    return addResponseObservability(
      NextResponse.json(
        { error: error?.message || 'Failed to open billing portal' },
        { status: 500 }
      ),
      startTime,
      '/api/subscriptions/stripe/portal'
    );
  }
}
