import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
// Webhook Stripe : pas de cache, pas de pré-render.
export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/stripe/webhook
 *
 * Gère les événements d'abonnement Stripe :
 *  - checkout.session.completed      : rattache customerId / subscriptionId
 *  - customer.subscription.created   : bascule en `trialing` / `active`
 *  - customer.subscription.updated   : met à jour statut, period, cancelAt
 *  - customer.subscription.deleted   : passe en `canceled` ou `expired`
 *  - invoice.payment_succeeded       : garde `active`, met à jour la période
 *  - invoice.payment_failed          : passe en `past_due`
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    const webhookSecret = getStripeWebhookSecret();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err?.message);
    return NextResponse.json(
      { error: `Webhook signature error: ${err?.message || 'unknown'}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          stripe
        );
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, stripe);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Ignorer silencieusement les autres événements.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling Stripe event ${event.type}:`, error);
    return NextResponse.json(
      { error: error?.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

function toDate(ts: number | null | undefined): Date | null {
  if (!ts || Number.isNaN(ts)) return null;
  return new Date(ts * 1000);
}

async function findSubscriptionRecord(
  stripeSubId: string | null | undefined,
  metadataSubscriptionId?: string | null
) {
  if (metadataSubscriptionId) {
    const byMeta = await prisma.subscription.findUnique({
      where: { id: metadataSubscriptionId },
    });
    if (byMeta) return byMeta;
  }
  if (stripeSubId) {
    const byProvider = await prisma.subscription.findUnique({
      where: { providerSubscriptionId: stripeSubId },
    });
    if (byProvider) return byProvider;
  }
  return null;
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe
) {
  if (session.mode !== 'subscription') return;

  const metadataSubId =
    (session.metadata?.subscriptionId as string | undefined) ?? null;
  const stripeSubId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null;

  if (!stripeSubId) return;

  const record = await findSubscriptionRecord(stripeSubId, metadataSubId);
  if (!record) {
    console.warn(
      `Stripe checkout.session.completed: no local subscription found (meta=${metadataSubId}, stripe=${stripeSubId})`
    );
    return;
  }

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      providerSubscriptionId: stripeSub.id,
      providerCustomerId: customerId,
      status: normalizeStatus(stripeSub.status),
      trialEndsAt: toDate((stripeSub as any).trial_end ?? null),
      currentPeriodStart: toDate((stripeSub as any).current_period_start ?? null),
      currentPeriodEnd: toDate((stripeSub as any).current_period_end ?? null),
      cancelAtPeriodEnd: !!(stripeSub as any).cancel_at_period_end,
    },
  });
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const metadataSubId =
    (stripeSub.metadata?.subscriptionId as string | undefined) ?? null;
  const record = await findSubscriptionRecord(stripeSub.id, metadataSubId);
  if (!record) {
    console.warn(
      `Stripe subscription event for unknown local subscription: ${stripeSub.id}`
    );
    return;
  }
  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      providerSubscriptionId: stripeSub.id,
      providerCustomerId:
        typeof stripeSub.customer === 'string'
          ? stripeSub.customer
          : stripeSub.customer?.id ?? null,
      status: normalizeStatus(stripeSub.status),
      trialEndsAt: toDate((stripeSub as any).trial_end ?? null),
      currentPeriodStart: toDate((stripeSub as any).current_period_start ?? null),
      currentPeriodEnd: toDate((stripeSub as any).current_period_end ?? null),
      cancelAtPeriodEnd: !!(stripeSub as any).cancel_at_period_end,
      canceledAt: toDate((stripeSub as any).canceled_at ?? null),
    },
  });
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const record = await findSubscriptionRecord(
    stripeSub.id,
    stripeSub.metadata?.subscriptionId as string | undefined
  );
  if (!record) return;
  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice, stripe: Stripe) {
  const stripeSubId =
    typeof (invoice as any).subscription === 'string'
      ? ((invoice as any).subscription as string)
      : (invoice as any).subscription?.id ?? null;
  if (!stripeSubId) return;
  const record = await prisma.subscription.findUnique({
    where: { providerSubscriptionId: stripeSubId },
  });
  if (!record) return;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      status: normalizeStatus(stripeSub.status),
      trialEndsAt: toDate((stripeSub as any).trial_end ?? null),
      currentPeriodStart: toDate((stripeSub as any).current_period_start ?? null),
      currentPeriodEnd: toDate((stripeSub as any).current_period_end ?? null),
      cancelAtPeriodEnd: !!(stripeSub as any).cancel_at_period_end,
    },
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const stripeSubId =
    typeof (invoice as any).subscription === 'string'
      ? ((invoice as any).subscription as string)
      : (invoice as any).subscription?.id ?? null;
  if (!stripeSubId) return;
  const record = await prisma.subscription.findUnique({
    where: { providerSubscriptionId: stripeSubId },
  });
  if (!record) return;
  await prisma.subscription.update({
    where: { id: record.id },
    data: { status: 'past_due' },
  });
}

function normalizeStatus(stripeStatus: Stripe.Subscription.Status): string {
  // Stripe utilise `incomplete`, `incomplete_expired`, `trialing`, `active`,
  // `past_due`, `canceled`, `unpaid`, `paused`. On les projette sur notre modèle.
  switch (stripeStatus) {
    case 'trialing':
    case 'active':
    case 'past_due':
    case 'canceled':
      return stripeStatus;
    case 'incomplete':
      return 'incomplete';
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
      return 'expired';
    default:
      return String(stripeStatus);
  }
}
