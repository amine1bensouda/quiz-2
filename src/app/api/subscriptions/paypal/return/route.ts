import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPaypalSubscription, normalizePaypalStatus } from '@/lib/paypal';
import { TRIAL_SECONDS } from '@/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/subscriptions/paypal/return?subscriptionId=...
 *
 * Callback appelé par PayPal après l'approbation utilisateur.
 * On vérifie le statut côté PayPal et on redirige vers le dashboard avec
 * un flag de succès. Le webhook BILLING.SUBSCRIPTION.ACTIVATED finalisera
 * le statut si le trial est honoré.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const localSubId = url.searchParams.get('subscriptionId');
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

  if (!localSubId) {
    return NextResponse.redirect(`${appUrl}/subscribe?error=missing_sub`);
  }

  const record = await prisma.subscription.findUnique({
    where: { id: localSubId },
  });
  if (!record || record.provider !== 'paypal' || !record.providerSubscriptionId) {
    return NextResponse.redirect(`${appUrl}/subscribe?error=unknown_sub`);
  }

  try {
    const paypalSub = await getPaypalSubscription(record.providerSubscriptionId);
    const normalized = normalizePaypalStatus(paypalSub.status);

    // PayPal ne notifie pas toujours immédiatement côté webhook : on reflète
    // ce que l'API nous dit, quitte à ce que le webhook réaligne après.
    const trialEndsAt =
      normalized === 'active' || normalized === 'trialing'
        ? new Date(Date.now() + TRIAL_SECONDS * 1000)
        : record.trialEndsAt;

    const nextBillingTime = paypalSub.billing_info?.next_billing_time
      ? new Date(paypalSub.billing_info.next_billing_time)
      : null;

    await prisma.subscription.update({
      where: { id: record.id },
      data: {
        status: normalized === 'active' ? 'trialing' : normalized,
        trialEndsAt,
        currentPeriodEnd: nextBillingTime ?? record.currentPeriodEnd,
      },
    });

    return NextResponse.redirect(`${appUrl}/dashboard?subscription=success`);
  } catch (error: any) {
    console.error('Error finalizing PayPal return:', error);
    return NextResponse.redirect(`${appUrl}/subscribe?error=paypal_failed`);
  }
}
