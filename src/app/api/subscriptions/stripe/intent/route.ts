import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { getPurchasablePlan, getTrialSeconds, type PlanId } from '@/lib/plans';
import { getUserActiveSubscription } from '@/lib/subscription-access';
import { canUserStartFreeTrial } from '@/lib/trial-eligibility';
import { addResponseObservability } from '@/lib/traffic-guard';
import { SITE_BRAND_UPPER } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  );
}

type SessionBuildInput = {
  subscriptionId: string;
  userId: string;
  planId: PlanId;
  courseId: string | null;
  customerId: string;
  stripePriceId: string;
  withTrial: boolean;
  promoCode?: string;
};

async function buildCheckoutSessionParams(
  stripe: Stripe,
  input: SessionBuildInput,
  mode: 'embedded' | 'hosted'
): Promise<Stripe.Checkout.SessionCreateParams> {
  const appUrl = getAppUrl();

  const subscriptionData: {
    metadata: Record<string, string>;
    trial_end?: number;
  } = {
    metadata: {
      subscriptionId: input.subscriptionId,
      userId: input.userId,
      plan: input.planId,
      courseId: input.courseId ?? '',
      withTrial: input.withTrial ? '1' : '0',
    },
  };

  if (input.withTrial) {
    subscriptionData.trial_end =
      Math.floor(Date.now() / 1000) + getTrialSeconds();
  }

  const params: Record<string, unknown> = {
    mode: 'subscription',
    locale: 'en',
    customer: input.customerId,
    branding_settings: {
      display_name: SITE_BRAND_UPPER,
    },
    line_items: [{ price: input.stripePriceId, quantity: 1 }],
    subscription_data: subscriptionData,
    metadata: {
      subscriptionId: input.subscriptionId,
      userId: input.userId,
      plan: input.planId,
      courseId: input.courseId ?? '',
    },
    allow_promotion_codes: !input.promoCode,
    payment_method_collection: 'always',
  };

  if (mode === 'embedded') {
    params.ui_mode = 'embedded';
    params.return_url = `${appUrl}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
  } else {
    params.success_url = `${appUrl}/dashboard?subscription=success`;
    params.cancel_url = `${appUrl}/checkout?canceled=1${
      input.courseId ? `&courseId=${encodeURIComponent(input.courseId)}` : ''
    }`;
  }

  if (input.promoCode) {
    const promotions = await stripe.promotionCodes.list({
      code: input.promoCode,
      active: true,
      limit: 1,
    });
    const promotion = promotions.data[0];
    if (!promotion) {
      throw new Error('Invalid promo code.');
    }
    params.discounts = [{ promotion_code: promotion.id }];
    params.allow_promotion_codes = false;
  }

  return params as unknown as Stripe.Checkout.SessionCreateParams;
}

/**
 * POST /api/subscriptions/stripe/intent
 * Creates a Stripe Checkout session (embedded when possible, hosted fallback).
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
    if (!plan?.stripePriceId) {
      return addResponseObservability(
        NextResponse.json({ error: 'Invalid plan or Stripe price not configured.' }, { status: 400 }),
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
          { error: 'You already have an active subscription. Manage it from your dashboard.' },
          { status: 409 }
        ),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    await prisma.subscription.updateMany({
      where: { userId: user.id, provider: 'stripe', status: 'incomplete' },
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
    const promoCode = typeof body?.promoCode === 'string' ? body.promoCode.trim() : '';

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

    const sessionInput: SessionBuildInput = {
      subscriptionId: subscription.id,
      userId: user.id,
      planId: plan.id,
      courseId,
      customerId,
      stripePriceId: plan.stripePriceId,
      withTrial,
      promoCode: promoCode || undefined,
    };

    let embeddedSession: Stripe.Checkout.Session | null = null;
    try {
      const embeddedParams = await buildCheckoutSessionParams(stripe, sessionInput, 'embedded');
      embeddedSession = await stripe.checkout.sessions.create(embeddedParams);
    } catch (embeddedError) {
      console.warn('Embedded Stripe Checkout unavailable, using hosted fallback:', embeddedError);
    }

    if (embeddedSession?.client_secret) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { providerCustomerId: customerId },
      });

      return addResponseObservability(
        NextResponse.json({
          clientSecret: embeddedSession.client_secret,
          checkoutMode: 'embedded',
          sessionId: embeddedSession.id,
          subscriptionId: subscription.id,
          withTrial,
        }),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    const hostedParams = await buildCheckoutSessionParams(stripe, sessionInput, 'hosted');
    const hostedSession = await stripe.checkout.sessions.create(hostedParams);

    if (!hostedSession.url) {
      return addResponseObservability(
        NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 500 }),
        startTime,
        '/api/subscriptions/stripe/intent'
      );
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { providerCustomerId: customerId },
    });

    return addResponseObservability(
      NextResponse.json({
        redirectUrl: hostedSession.url,
        checkoutMode: 'hosted',
        sessionId: hostedSession.id,
        subscriptionId: subscription.id,
        withTrial,
      }),
      startTime,
      '/api/subscriptions/stripe/intent'
    );
  } catch (error: unknown) {
    console.error('Error creating Stripe checkout session:', error);
    return addResponseObservability(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
        { status: 500 }
      ),
      startTime,
      '/api/subscriptions/stripe/intent'
    );
  }
}
