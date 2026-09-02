import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import {
  canUserAccessCourse,
  getUserActiveSubscription,
} from '@/lib/subscription-access';
import { formatPlanPrice, PLANS } from '@/lib/plans';
import CheckoutForm from '@/components/Checkout/CheckoutForm';
import { canUserStartFreeTrial } from '@/lib/trial-eligibility';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Checkout',
  description: `Complete your ${formatPlanPrice(PLANS.SINGLE_COURSE)} subscription to Crack The Curve.`,
};

interface CheckoutPageProps {
  searchParams?: Promise<{
    courseId?: string;
    canceled?: string;
    error?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = (await searchParams) ?? {};
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

  if (user) {
    const active = await getUserActiveSubscription(user.id);

    if (requestedCourseId) {
      const hasAccess = await canUserAccessCourse(user.id, requestedCourseId, false);
      if (hasAccess) {
        redirect(
          requestedCourse ? `/quiz/course/${requestedCourse.slug}` : '/dashboard'
        );
      }
    } else if (active) {
      redirect('/dashboard?subscription=already');
    }
  }

  const trialEligible = user ? await canUserStartFreeTrial(user.id) : true;

  return (
    <main className="checkout-shell min-h-screen bg-[#080810] py-10 text-[#eeeaf4] relative overflow-hidden">
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-[#f5c14a]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-2rem] bottom-12 h-64 w-64 rounded-full bg-[#b388ff]/10 blur-3xl" />

      {params.canceled && (
        <div className="relative mx-auto w-full max-w-6xl px-4 lg:px-8 mb-6">
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/35 px-4 py-3 text-sm text-amber-100">
            Payment canceled. No charge was made.
          </div>
        </div>
      )}
      {params.error && (
        <div className="relative mx-auto w-full max-w-6xl px-4 lg:px-8 mb-6">
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            An error occurred while processing the payment. Please try again.
          </div>
        </div>
      )}

      <CheckoutForm
        courses={courses}
        defaultCourseId={requestedCourseId || null}
        initialUser={
          user
            ? { id: user.id, email: user.email, name: user.name }
            : null
        }
        trialEligible={trialEligible}
      />
    </main>
  );
}
