import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { createPaypalSubscription } from '@/lib/paypal';
import { getPlan, type PlanId } from '@/lib/plans';
import { getUserActiveSubscription } from '@/lib/subscription-access';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/subscriptions/paypal/subscribe
 *
 * Crée une souscription PayPal (plan pré-configuré avec trial de 2 jours)
 * et renvoie l'URL d'approbation à ouvrir dans un onglet PayPal.
 * Body : { plan: 'SINGLE_COURSE' | 'ALL_ACCESS', courseId?: string }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/subscriptions/paypal/subscribe'
      );
    }

    const body = (await request.json().catch(() => null)) as {
      plan?: string;
      courseId?: string;
    } | null;

    const plan = getPlan((body?.plan as PlanId | undefined) ?? null);
    if (!plan) {
      return addResponseObservability(
        NextResponse.json(
          { error: 'Invalid plan. Use SINGLE_COURSE or ALL_ACCESS.' },
          { status: 400 }
        ),
        startTime,
        '/api/subscriptions/paypal/subscribe'
      );
    }

    if (!plan.paypalPlanId) {
      return addResponseObservability(
        NextResponse.json(
          {
            error: `PayPal plan not configured for ${plan.id}. Set PAYPAL_PLAN_${plan.id}_ID.`,
          },
          { status: 500 }
        ),
        startTime,
        '/api/subscriptions/paypal/subscribe'
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
          '/api/subscriptions/paypal/subscribe'
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
          '/api/subscriptions/paypal/subscribe'
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
        '/api/subscriptions/paypal/subscribe'
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: plan.id,
        courseId,
        provider: 'paypal',
        status: 'incomplete',
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const { subscription: paypalSub, approveUrl } = await createPaypalSubscription({
      planId: plan.paypalPlanId,
      customId: subscription.id,
      subscriberEmail: user.email,
      subscriberName: { givenName: user.name, surname: '' },
      returnUrl: `${appUrl}/api/subscriptions/paypal/return?subscriptionId=${subscription.id}`,
      cancelUrl: `${appUrl}/subscribe?canceled=1`,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        providerSubscriptionId: paypalSub.id,
      },
    });

    return addResponseObservability(
      NextResponse.json({
        subscriptionId: subscription.id,
        paypalSubscriptionId: paypalSub.id,
        approveUrl,
      }),
      startTime,
      '/api/subscriptions/paypal/subscribe'
    );
  } catch (error: any) {
    console.error('Error creating PayPal subscription:', error);
    return addResponseObservability(
      NextResponse.json(
        { error: error?.message || 'Failed to create PayPal subscription' },
        { status: 500 }
      ),
      startTime,
      '/api/subscriptions/paypal/subscribe'
    );
  }
}
