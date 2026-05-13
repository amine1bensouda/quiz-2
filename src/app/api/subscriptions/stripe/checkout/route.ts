import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { getPlan, TRIAL_HOURS, type PlanId } from '@/lib/plans';
import { getUserActiveSubscription } from '@/lib/subscription-access';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/stripe/checkout
 *
 * Crée une session Stripe Checkout en mode subscription avec un trial de 48h.
 * Body : { plan: 'SINGLE_COURSE' | 'ALL_ACCESS', courseId?: string }
 *
 * Règles :
 *  - user doit être loggé
 *  - pas d'abo actif déjà en cours
 *  - courseId obligatoire (et cours publié) pour SINGLE_COURSE
 *  - pas de courseId pour ALL_ACCESS (on ignore si fourni)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/subscriptions/stripe/checkout'
      );
    }

    const body = (await request.json().catch(() => null)) as {
      plan?: string;
      courseId?: string;
    } | null;

    const planId = body?.plan as PlanId | undefined;
    const plan = getPlan(planId ?? null);
    if (!plan) {
      return addResponseObservability(
        NextResponse.json(
          { error: 'Invalid plan. Use SINGLE_COURSE or ALL_ACCESS.' },
          { status: 400 }
        ),
        startTime,
        '/api/subscriptions/stripe/checkout'
      );
    }

    if (!plan.stripePriceId) {
      return addResponseObservability(
        NextResponse.json(
          {
            error: `Stripe price not configured for plan ${plan.id}. Set STRIPE_PRICE_${plan.id}_ID.`,
          },
          { status: 500 }
        ),
        startTime,
        '/api/subscriptions/stripe/checkout'
      );
    }

    let courseId: string | null = null;
    if (plan.requiresCourseId) {
      const raw = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
      if (!raw) {
        return addResponseObservability(
          NextResponse.json(
            { error: 'courseId is required for SINGLE_COURSE plan.' },
            { status: 400 }
          ),
          startTime,
          '/api/subscriptions/stripe/checkout'
        );
      }
      const course = await prisma.course.findUnique({
        where: { id: raw },
        select: { id: true, status: true },
      });
      if (!course || course.status !== 'published') {
        return addResponseObservability(
          NextResponse.json(
            { error: 'Course not found or not published.' },
            { status: 404 }
          ),
          startTime,
          '/api/subscriptions/stripe/checkout'
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
              'You already have an active subscription. Manage it from your dashboard before changing plans.',
          },
          { status: 409 }
        ),
        startTime,
        '/api/subscriptions/stripe/checkout'
      );
    }

    const stripe = getStripe();

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: plan.id,
        courseId,
        provider: 'stripe',
        status: 'incomplete',
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const trialPeriodDays = Math.max(1, Math.ceil(TRIAL_HOURS / 24));

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      locale: 'en',
      customer_email: user.email,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialPeriodDays,
        metadata: {
          subscriptionId: subscription.id,
          userId: user.id,
          plan: plan.id,
          courseId: courseId ?? '',
        },
      },
      metadata: {
        subscriptionId: subscription.id,
        userId: user.id,
        plan: plan.id,
        courseId: courseId ?? '',
      },
      success_url: `${appUrl}/dashboard?subscription=success`,
      cancel_url: `${appUrl}/subscribe?canceled=1`,
      allow_promotion_codes: true,
    });

    return addResponseObservability(
      NextResponse.json({ url: session.url, sessionId: session.id }),
      startTime,
      '/api/subscriptions/stripe/checkout'
    );
  } catch (error: any) {
    console.error('Error creating Stripe subscription checkout:', error);
    return addResponseObservability(
      NextResponse.json(
        { error: error?.message || 'Failed to create checkout session' },
        { status: 500 }
      ),
      startTime,
      '/api/subscriptions/stripe/checkout'
    );
  }
}
