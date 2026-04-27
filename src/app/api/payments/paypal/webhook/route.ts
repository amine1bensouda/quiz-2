import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getPaypalSubscription,
  normalizePaypalStatus,
  verifyPaypalWebhookSignature,
} from '@/lib/paypal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/paypal/webhook
 *
 * Gère les événements PayPal Billing :
 *  - BILLING.SUBSCRIPTION.ACTIVATED / CREATED  => statut actif / trialing
 *  - BILLING.SUBSCRIPTION.UPDATED              => rafraîchir (next billing, etc.)
 *  - BILLING.SUBSCRIPTION.CANCELLED            => canceled
 *  - BILLING.SUBSCRIPTION.SUSPENDED            => past_due
 *  - BILLING.SUBSCRIPTION.EXPIRED              => expired
 *  - BILLING.SUBSCRIPTION.PAYMENT.FAILED       => past_due
 *  - PAYMENT.SALE.COMPLETED                    => garde active + push period
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.error('PAYPAL_WEBHOOK_ID is not configured.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });

  const verified = await verifyPaypalWebhookSignature({
    webhookId,
    headers,
    rawBody,
  });
  if (!verified) {
    return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event_type?: string;
    resource?: Record<string, any>;
  };

  try {
    const type = event.event_type || '';

    if (type.startsWith('BILLING.SUBSCRIPTION.')) {
      await handleSubscriptionEvent(type, event.resource ?? {});
    } else if (type === 'PAYMENT.SALE.COMPLETED' || type === 'PAYMENT.CAPTURE.COMPLETED') {
      await handlePaymentCompleted(event.resource ?? {});
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('PayPal webhook handler error:', error);
    return NextResponse.json(
      { error: error?.message || 'handler error' },
      { status: 500 }
    );
  }
}

async function findByPaypalSubId(paypalSubId: string | undefined) {
  if (!paypalSubId) return null;
  return prisma.subscription.findUnique({
    where: { providerSubscriptionId: paypalSubId },
  });
}

async function handleSubscriptionEvent(eventType: string, resource: Record<string, any>) {
  const paypalSubId = (resource.id as string | undefined) || undefined;
  const record = await findByPaypalSubId(paypalSubId);
  if (!record) {
    console.warn('PayPal webhook: no local subscription for', paypalSubId);
    return;
  }

  // On cherche à éviter toute divergence : on requête l'état courant PayPal.
  let paypalState = resource;
  try {
    if (paypalSubId) {
      paypalState = (await getPaypalSubscription(paypalSubId)) as any;
    }
  } catch (err) {
    console.warn('PayPal webhook: failed to re-fetch subscription', err);
  }

  const status = normalizePaypalStatus(paypalState.status as string | undefined);

  // Les ACTIVE PayPal incluent la phase trial si elle n'est pas encore passée.
  // On détecte le trial via la date de premier billing.
  const now = Date.now();
  const nextBillingTs = paypalState.billing_info?.next_billing_time
    ? new Date(paypalState.billing_info.next_billing_time).getTime()
    : null;
  const firstPaymentTs = paypalState.billing_info?.last_payment?.time
    ? new Date(paypalState.billing_info.last_payment.time).getTime()
    : null;

  let finalStatus = status;
  if (status === 'active' && firstPaymentTs === null && nextBillingTs && nextBillingTs > now) {
    finalStatus = 'trialing';
  }
  if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
    finalStatus = 'past_due';
  }
  if (eventType === 'BILLING.SUBSCRIPTION.EXPIRED') {
    finalStatus = 'expired';
  }
  if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
    finalStatus = 'canceled';
  }
  if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
    finalStatus = 'past_due';
  }

  await prisma.subscription.update({
    where: { id: record.id },
    data: {
      status: finalStatus,
      trialEndsAt:
        finalStatus === 'trialing' && nextBillingTs
          ? new Date(nextBillingTs)
          : record.trialEndsAt,
      currentPeriodEnd: nextBillingTs ? new Date(nextBillingTs) : record.currentPeriodEnd,
      canceledAt:
        finalStatus === 'canceled' || finalStatus === 'expired' ? new Date() : record.canceledAt,
      providerCustomerId:
        (paypalState.subscriber?.payer_id as string | undefined) ??
        record.providerCustomerId,
    },
  });
}

async function handlePaymentCompleted(resource: Record<string, any>) {
  const paypalSubId =
    (resource.billing_agreement_id as string | undefined) ||
    (resource.custom as string | undefined) ||
    undefined;
  const record = await findByPaypalSubId(paypalSubId);
  if (!record) return;

  try {
    if (paypalSubId) {
      const paypalState = await getPaypalSubscription(paypalSubId);
      const nextBillingTs = paypalState.billing_info?.next_billing_time
        ? new Date(paypalState.billing_info.next_billing_time)
        : null;
      await prisma.subscription.update({
        where: { id: record.id },
        data: {
          status: 'active',
          currentPeriodEnd: nextBillingTs ?? record.currentPeriodEnd,
        },
      });
    }
  } catch (err) {
    console.warn('PayPal PAYMENT.SALE.COMPLETED re-fetch failed:', err);
  }
}
