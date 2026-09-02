import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { getPurchasablePlan, getTrialSeconds, type PlanId } from '@/lib/plans';
import { getUserActiveSubscription } from '@/lib/subscription-access';
import { canUserStartFreeTrial } from '@/lib/trial-eligibility';
import { addResponseObservability } from '@/lib/traffic-guard';
import { getStripeCheckoutBrandingSettings } from '@/lib/stripe-checkout-branding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  );
}

/**
 * POST /api/subscriptions/stripe/intent
 * Creates an embedded Checkout Session so payment stays on /checkout.
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
        NextResponse.json(
          { error: 'Invalid plan or Stripe price not configured.' },
          { status: 400 }
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
    const promoCode =
      typeof body?.promoCode === 'string' ? body.promoCode.trim() : '';
    const appUrl = getAppUrl();

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

    const subscriptionData: {
      metadata: Record<string, string>;
      trial_end?: number;
    } = {
      metadata: {
        subscriptionId: subscription.id,
        userId: user.id,
        plan: plan.id,
        courseId: courseId ?? '',
        withTrial: withTrial ? '1' : '0',
      },
    };
    if (withTrial) {
      subscriptionData.trial_end =
        Math.floor(Date.now() / 1000) + getTrialSeconds();
    }

    const sessionParams: Record<string, unknown> = {
      ui_mode: 'form',
      mode: 'subscription',
      locale: 'en',
      customer: customerId,
      branding_settings: getStripeCheckoutBrandingSettings(),
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      subscription_data: subscriptionData,
      metadata: {
        subscriptionId: subscription.id,
        userId: user.id,
        plan: plan.id,
        courseId: courseId ?? '',
      },
      return_url: `${appUrl}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      redirect_on_completion: 'if_required',
      allow_promotion_codes: !promoCode,
      payment_method_collection: 'always',
    };

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
      sessionParams.discounts = [{ promotion_code: promotion.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams as never);

    if (!session.client_secret) {
      return addResponseObservability(
        NextResponse.json(
          { error: 'Stripe did not return a checkout client secret.' },
          { status: 500 }
        ),
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
        clientSecret: session.client_secret,
        checkoutMode: 'form',
        sessionId: session.id,
        subscriptionId: subscription.id,
        withTrial,
      }),
      startTime,
      '/api/subscriptions/stripe/intent'
    );
  } catch (error: unknown) {
    console.error('Error creating Stripe embedded checkout session:', error);
    return addResponseObservability(
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create checkout session',
        },
        { status: 500 }
      ),
      startTime,
      '/api/subscriptions/stripe/intent'
    );
  }
}
