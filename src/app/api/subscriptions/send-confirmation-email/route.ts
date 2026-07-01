import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import { isEmailConfigured } from '@/lib/email';
import { sendSubscriptionCheckoutEmail } from '@/lib/subscription-order-email';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/send-confirmation-email
 *
 * Fallback idempotent après retour Stripe/PayPal (?subscription=success).
 * Le webhook envoie déjà l'e-mail ; cette route couvre les échecs silencieux
 * (RESEND absent, migration manquante, etc.).
 */
export async function POST() {
  const startTime = Date.now();
  const path = '/api/subscriptions/send-confirmation-email';

  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        path
      );
    }

    if (!isEmailConfigured()) {
      console.error(
        '[subscription-email] No email provider configured (RESEND_API_KEY or SMTP_*).'
      );
      return addResponseObservability(
        NextResponse.json({ sent: false, reason: 'email_not_configured' }),
        startTime,
        path
      );
    }

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        provider: { in: ['stripe', 'paypal'] },
        status: { in: ['trialing', 'active', 'past_due'] },
        providerSubscriptionId: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!sub) {
      return addResponseObservability(
        NextResponse.json({ sent: false, reason: 'no_active_subscription' }),
        startTime,
        path
      );
    }

    await sendSubscriptionCheckoutEmail({
      subscriptionId: sub.id,
      provider: sub.provider === 'paypal' ? 'paypal' : 'stripe',
    });

    return addResponseObservability(
      NextResponse.json({ sent: true }),
      startTime,
      path
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[subscription-email] Fallback send failed:', error);
    return addResponseObservability(
      NextResponse.json(
        { sent: false, reason: 'send_failed', message },
        { status: 500 }
      ),
      startTime,
      path
    );
  }
}
