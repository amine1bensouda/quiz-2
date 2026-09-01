import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { getPurchasablePlan, getTrialSeconds, type PlanId } from '@/lib/plans';
import { getUserActiveSubscription } from '@/lib/subscription-access';
import { canUserStartFreeTrial } from '@/lib/trial-eligibility';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/stripe/intent
 * Creates a Stripe subscription and returns a client secret for Payment Element.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    const body = (await request.json().catch(() => null)) as {
      plan?: string;
      courseId?: string;
      promoCode?: string;
    } | null;

    const planId = body?.plan as PlanId | undefined;
    const plan = getPurchasablePlan(planId ?? 'SINGLE_COURSE');
    if (!plan) {
      return addResponseObservability(
        NextResponse.json({ error: 'Invalid plan.' }, { status: 400 }),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    if (!plan.stripePriceId) {
      return addResponseObservability(
        NextResponse.json(
          { error: `Stripe price not configured for plan ${plan.id}.` },
          { status: 500 }
        ),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    let courseId: string | null = null;
    if (plan.requiresCourseId) {
      const raw = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
      if (!raw) {
        return addResponseObservability(
          NextResponse.json({ error: 'courseId is required.' }, { status: 400 }),
          startTime,
          '/api/subscriptions/stripe/intent'
        );
      }
      const course = await prisma.course.findUnique({
        where: { id: raw },
        select: { id: true, status: true },
      });
      if (!course || course.status !== 'published') {
        return addResponseObservability(
          NextResponse.json({ error: 'Course not found or not published.' }, { status: 404 }),
          startTime,
          '/api/subscriptions/stripe/intent'
        );
      }
      courseId = course.id;
    }

    const existing = await getUserActiveSubscription(user.id);
    if (existing) {
      return addResponseObservability(
        NextResponse.json(
          {
            error:
              'You already have an active subscription. Manage it from your dashboard.',
          },
          { status: 409 }
        ),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    await prisma.subscription.updateMany({
      where: {
        userId: user.id,
        provider: 'stripe',
        status: 'incomplete',
      },
      data: { status: 'expired' },
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: plan.id,
        courseId,
        provider: 'stripe',
        status: 'incomplete',
      },
    });

    const stripe = getStripe();
    const withTrial = await canUserStartFreeTrial(user.id);

    let customerId =
      (
        await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            provider: 'stripe',
            providerCustomerId: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          select: { providerCustomerId: true },
        })
      )?.providerCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        subscriptionId: subscription.id,
        userId: user.id,
        plan: plan.id,
        courseId: courseId ?? '',
        withTrial: withTrial ? '1' : '0',
      },
      expand: ['pending_setup_intent', 'latest_invoice.payment_intent'],
    };

    if (withTrial) {
      subscriptionData.trial_end =
        Math.floor(Date.now() / 1000) + getTrialSeconds();
    }

    const promoCode = typeof body?.promoCode === 'string' ? body.promoCode.trim() : '';
    if (promoCode) {
      const promotions = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });
      const promotion = promotions.data[0];
      if (!promotion) {
        return addResponseObservability(
          NextResponse.json({ error: 'Invalid promo code.' }, { status: 400 }),
          startTime,
          '/api/subscriptions/stripe/intent'
        );
      }
      subscriptionData.discounts = [{ promotion_code: promotion.id }];
    }

    const stripeSub = await stripe.subscriptions.create(subscriptionData);

    const setupIntent = stripeSub.pending_setup_intent;
    const latestInvoice =
      stripeSub.latest_invoice && typeof stripeSub.latest_invoice !== 'string'
        ? stripeSub.latest_invoice
        : null;
    const paymentIntent = latestInvoice
      ? (latestInvoice as Stripe.Invoice & {
          payment_intent?: string | Stripe.PaymentIntent | null;
        }).payment_intent
      : null;

    let clientSecret: string | null = null;
    let intentType: 'setup' | 'payment' = 'setup';

    if (setupIntent && typeof setupIntent !== 'string') {
      clientSecret = setupIntent.client_secret;
      intentType = 'setup';
    } else if (paymentIntent && typeof paymentIntent !== 'string') {
      clientSecret = paymentIntent.client_secret;
      intentType = 'payment';
    }

    if (!clientSecret) {
      return addResponseObservability(
        NextResponse.json(
          { error: 'Stripe did not return a payment client secret.' },
          { status: 500 }
        ),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        providerSubscriptionId: stripeSub.id,
        providerCustomerId: customerId,
      },
    });

    return addResponseObservability(
      NextResponse.json({
        clientSecret,
        intentType,
        subscriptionId: subscription.id,
        withTrial,
      }),
      startTime,
      '/api/subscriptions/stripe/intent'
    );
  } catch (error: unknown) {
    console.error('Error creating Stripe subscription intent:', error);
    return addResponseObservability(
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create payment intent',
        },
        { status: 500 }
      ),
      startTime,
      '/api/subscriptions/stripe/intent'
    );
  }
}
