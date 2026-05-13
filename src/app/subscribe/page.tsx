import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { getUserActiveSubscription } from '@/lib/subscription-access';
import SubscriptionPaywall from '@/components/Subscription/SubscriptionPaywall';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Choose your subscription',
  description:
    'Subscribe to Quiz Platform: $7/month for a single course, or $25/month for all courses. 48h free trial.',
};

interface SubscribePageProps {
  searchParams?: Promise<{ courseId?: string; canceled?: string; error?: string }>;
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
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

  if (user) {
    const active = await getUserActiveSubscription(user.id);
    if (active) {
      redirect('/dashboard?subscription=already');
    }
  }

  const courses = await prisma.course.findMany({
    where: { status: 'published' },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-slate-50 py-10 transition-colors dark:bg-[#080810]">
      {params.canceled && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-100">
            Payment canceled. No charge was made. You can try again whenever
            you want.
          </div>
        </div>
      )}
      {params.error && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200">
            An error occurred while processing the payment. Please try again.
          </div>
        </div>
      )}
      <SubscriptionPaywall
        courses={courses}
        defaultCourseId={params.courseId ?? null}
        isAuthenticated={!!user}
        returnUrl="/subscribe"
      />
    </main>
  );
}
