import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * URL absolue où Stripe renvoie l'utilisateur après le portail (annulation, CB, etc.).
 * Doit être en HTTPS en prod et correspondre à un domaine autorisé dans
 * Stripe Dashboard → Paramètres → Portail client → Domaines / URLs autorisés.
 */
function getBillingPortalReturnUrl(): string {
  const siteBase =
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ||
    'http://localhost:3000';

  const explicit = process.env.STRIPE_BILLING_PORTAL_RETURN_URL?.trim();
  if (explicit) {
    if (explicit.startsWith('http://') || explicit.startsWith('https://')) {
      return explicit;
    }
    const path = explicit.startsWith('/') ? explicit : `/${explicit}`;
    return `${siteBase}${path}`;
  }

  const path = '/dashboard?from=stripe-portal';
  return `${siteBase}${path}`;
}

/**
 * POST /api/subscriptions/stripe/portal
 *
 * Ouvre une session Stripe Customer Billing Portal pour gérer/annuler
 * l'abonnement. Repose sur `providerCustomerId` stocké sur la Subscription.
 * La session force `locale: 'en'` ; le nom affiché côté Stripe suit le profil
 * marchand du compte (Dashboard) sauf si STRIPE_BILLING_PORTAL_CONFIGURATION_ID est défini.
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

    const returnUrl = getBillingPortalReturnUrl();
    if (
      process.env.NODE_ENV === 'production' &&
      (returnUrl.includes('localhost') || returnUrl.includes('127.0.0.1'))
    ) {
      console.error(
        '[Stripe portal] return_url points to localhost in production. Set NEXT_PUBLIC_APP_URL (or STRIPE_BILLING_PORTAL_RETURN_URL) to your public https URL and allow that domain in Stripe Customer portal settings.'
      );
    }

    const stripe = getStripe();
    const configurationId = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.providerCustomerId,
      return_url: returnUrl,
      /** Évite le portail en français selon le navigateur ; aligné avec Checkout `locale: 'en'`. */
      locale: 'en',
      ...(configurationId ? { configuration: configurationId } : {}),
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
