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
    <main className="checkout-shell min-h-screen bg-[#eef1f4] text-[#1f2937]">
      {params.canceled && (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Payment canceled. No charge was made.
          </div>
        </div>
      )}
      {params.error && (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
