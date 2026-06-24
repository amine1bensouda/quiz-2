import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import {
  canUserAccessCourse,
  getUserActiveSubscription,
} from '@/lib/subscription-access';
import { parseCheckoutIntent } from '@/lib/subscription-checkout-url';
import { formatPlanPrice, PLANS } from '@/lib/plans';
import SubscriptionPaywall from '@/components/Subscription/SubscriptionPaywall';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Choose your subscription',
  description: `Subscribe to Quiz Platform: ${formatPlanPrice(PLANS.SINGLE_COURSE)} per course. 48h free trial.`,
};

interface SubscribePageProps {
  searchParams?: Promise<{
    courseId?: string;
    canceled?: string;
    error?: string;
    startCheckout?: string;
  }>;
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const params = (await searchParams) ?? {};
  const autoStartCheckout = parseCheckoutIntent(params.startCheckout);
  const user = await getCurrentUserFromSession();

  if (user && params.canceled) {
    await prisma.subscription.deleteMany({
      where: {
        userId: user.id,
        provider: 'stripe',
        status: 'incomplete',
        providerSubscriptionId: null,
      },
    });
  }

  const courses = await prisma.course.findMany({
    where: { status: 'published' },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: 'desc' },
  });

  const requestedCourseId =
    typeof params.courseId === 'string' ? params.courseId.trim() : '';
  const requestedCourse = requestedCourseId
    ? courses.find((course) => course.id === requestedCourseId)
    : null;

  let existingSubscriptionCourseTitle: string | null = null;

  if (user) {
    const active = await getUserActiveSubscription(user.id);

    if (requestedCourseId) {
      const hasAccess = await canUserAccessCourse(
        user.id,
        requestedCourseId,
        false
      );
      if (hasAccess) {
        redirect(
          requestedCourse
            ? `/quiz/course/${requestedCourse.slug}`
            : '/dashboard'
        );
      }
    } else if (active) {
      redirect('/dashboard?subscription=already');
    }

    if (
      active?.plan === 'SINGLE_COURSE' &&
      active.courseId &&
      active.courseId !== requestedCourseId
    ) {
      const currentCourse = courses.find((course) => course.id === active.courseId);
      existingSubscriptionCourseTitle = currentCourse?.title ?? null;
    }
  }

  const subscribeReturnUrl = requestedCourseId
    ? `/subscribe?courseId=${encodeURIComponent(requestedCourseId)}`
    : '/subscribe';

  return (
    <main className="subscribe-page paywall-page min-h-screen bg-[#080810] py-10 text-[#eeeaf4] relative overflow-hidden">
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-[#f5c14a]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-2rem] bottom-12 h-64 w-64 rounded-full bg-[#b388ff]/10 blur-3xl" />
      <div className="relative">
      {params.canceled && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/35 px-4 py-3 text-sm text-amber-100">
            Payment canceled. No charge was made. You can try again whenever
            you want.
          </div>
        </div>
      )}
      {params.error && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            An error occurred while processing the payment. Please try again.
          </div>
        </div>
      )}
      <SubscriptionPaywall
        courses={courses}
        defaultCourseId={requestedCourseId || null}
        isAuthenticated={!!user}
        returnUrl={subscribeReturnUrl}
        autoStartCheckout={autoStartCheckout}
        title={
          requestedCourse ? `Unlock ${requestedCourse.title}` : undefined
        }
        existingSubscriptionCourseTitle={existingSubscriptionCourseTitle}
      />
      </div>
    </main>
  );
}
