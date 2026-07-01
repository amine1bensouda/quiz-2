import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { stripeSubscriptionHasScheduledCancellation } from '@/lib/subscription-access';
import {
  getStripeSubscriptionPeriodEnd,
  getStripeSubscriptionPeriodStart,
} from '@/lib/stripe-subscription-period';
import { isEmailConfigured } from '@/lib/email';
import {
  sendSubscriptionCheckoutEmail,
  sendSubscriptionInvoiceEmail,
} from '@/lib/subscription-order-email';

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
 *  - invoice.payment_succeeded / invoice.paid : garde `active`, met à jour la période
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
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, stripe);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(
          event.data.object as Stripe.Invoice,
          stripe
        );
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

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const direct = (invoice as { subscription?: string | { id?: string } | null })
    .subscription;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object' && typeof direct.id === 'string') {
    return direct.id;
  }
  const nested = (invoice as {
    parent?: { subscription_details?: { subscription?: string | null } };
  }).parent?.subscription_details?.subscription;
  return typeof nested === 'string' ? nested : null;
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
    (session.metadata?.subscriptionId as string | undefined) ??
    (typeof session.client_reference_id === 'string'
      ? session.client_reference_id
      : null);
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
  const trialEndsAt = toDate((stripeSub as any).trial_end ?? null);
  const status = normalizeStatus(stripeSub.status);
  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      providerSubscriptionId: stripeSub.id,
      providerCustomerId: customerId,
      status,
      trialEndsAt,
      currentPeriodStart: toDate(getStripeSubscriptionPeriodStart(stripeSub as any)),
      currentPeriodEnd: toDate(getStripeSubscriptionPeriodEnd(stripeSub as any)),
      cancelAtPeriodEnd: stripeSubscriptionHasScheduledCancellation(stripeSub as any),
      canceledAt: toDate((stripeSub as any).canceled_at ?? null),
    },
  });

  await trySendCheckoutConfirmationEmail(record.id, 'stripe', 'checkout.session.completed');
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
  const trialEndsAt = toDate((stripeSub as any).trial_end ?? null);
  const status = normalizeStatus(stripeSub.status);
  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      providerSubscriptionId: stripeSub.id,
      providerCustomerId:
        typeof stripeSub.customer === 'string'
          ? stripeSub.customer
          : stripeSub.customer?.id ?? null,
      status,
      trialEndsAt,
      currentPeriodStart: toDate(getStripeSubscriptionPeriodStart(stripeSub as any)),
      currentPeriodEnd: toDate(getStripeSubscriptionPeriodEnd(stripeSub as any)),
      cancelAtPeriodEnd: stripeSubscriptionHasScheduledCancellation(stripeSub as any),
      canceledAt: toDate((stripeSub as any).canceled_at ?? null),
    },
  });

  if (status === 'trialing' || status === 'active') {
    await trySendCheckoutConfirmationEmail(
      record.id,
      'stripe',
      'customer.subscription.updated'
    );
  }
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
  const stripeSubId = getInvoiceSubscriptionId(invoice);
  if (!stripeSubId) return;
  let record = await prisma.subscription.findUnique({
    where: { providerSubscriptionId: stripeSubId },
  });
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  if (!record) {
    const metadataSubId =
      (stripeSub.metadata?.subscriptionId as string | undefined) ?? null;
    record = await findSubscriptionRecord(stripeSubId, metadataSubId);
  }
  if (!record) return;

  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      status: normalizeStatus(stripeSub.status),
      trialEndsAt: toDate((stripeSub as any).trial_end ?? null),
      currentPeriodStart: toDate(getStripeSubscriptionPeriodStart(stripeSub as any)),
      currentPeriodEnd: toDate(getStripeSubscriptionPeriodEnd(stripeSub as any)),
      cancelAtPeriodEnd: stripeSubscriptionHasScheduledCancellation(stripeSub as any),
    },
  });

  const amountPaid = invoice.amount_paid ?? 0;
  if (amountPaid <= 0) return;

  const invoiceNumber =
    invoice.number ||
    (typeof invoice.id === 'string' ? invoice.id : 'invoice');
  const invoiceUrl =
    invoice.hosted_invoice_url || invoice.invoice_pdf || null;

  try {
    await sendSubscriptionInvoiceEmail({
      subscriptionId: record.id,
      provider: 'stripe',
      invoiceNumber,
      amountCents: amountPaid,
      currency: invoice.currency || 'usd',
      invoiceUrl,
      paidAt: toDate(invoice.status_transitions?.paid_at ?? null),
    });
  } catch (emailError) {
    console.error('Failed to send payment receipt email:', emailError);
  }
}

async function handleInvoiceFailed(
  invoice: Stripe.Invoice,
  stripe: Stripe
) {
  const stripeSubId = getInvoiceSubscriptionId(invoice);
  if (!stripeSubId) return;
  let record = await prisma.subscription.findUnique({
    where: { providerSubscriptionId: stripeSubId },
  });
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  if (!record) {
    const metadataSubId =
      (stripeSub.metadata?.subscriptionId as string | undefined) ?? null;
    record = await findSubscriptionRecord(stripeSubId, metadataSubId);
  }
  if (!record) return;
  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      status: normalizeStatus(stripeSub.status),
      trialEndsAt: toDate((stripeSub as any).trial_end ?? null),
      currentPeriodStart: toDate(getStripeSubscriptionPeriodStart(stripeSub as any)),
      currentPeriodEnd: toDate(getStripeSubscriptionPeriodEnd(stripeSub as any)),
      cancelAtPeriodEnd: stripeSubscriptionHasScheduledCancellation(stripeSub as any),
    },
  });
}

async function trySendCheckoutConfirmationEmail(
  subscriptionId: string,
  provider: 'stripe' | 'paypal',
  source: string
): Promise<void> {
  if (!isEmailConfigured()) {
    console.error(
      `[subscription-email] ${source}: email not configured — set RESEND_API_KEY on the server.`
    );
    return;
  }

  try {
    await sendSubscriptionCheckoutEmail({ subscriptionId, provider });
  } catch (emailError) {
    console.error(
      `[subscription-email] ${source}: failed for subscription ${subscriptionId}:`,
      emailError
    );
  }
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
