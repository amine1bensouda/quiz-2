'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getQuizStats, logout, type QuizAttempt, type User } from '@/lib/auth-client';
import { formatDuration } from '@/lib/utils';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';

interface SubscriptionInfo {
  id: string;
  plan: 'SINGLE_COURSE' | 'ALL_ACCESS' | string;
  status: string;
  provider: 'stripe' | 'paypal' | string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  course: { id: string; title: string; slug: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, string> = {
    trialing:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-500/40',
    active:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/45 dark:text-green-200 dark:border-green-500/35',
    past_due:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500/35',
    incomplete:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-[#1a1a2e] dark:text-[#d4d0dc] dark:border-white/15',
    canceled:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/45 dark:text-red-200 dark:border-red-500/35',
    expired:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/45 dark:text-red-200 dark:border-red-500/35',
  };
  const label: Record<string, string> = {
    trialing: 'Trial active',
    active: 'Active',
    past_due: 'Past due',
    incomplete: 'Incomplete',
    canceled: 'Canceled',
    expired: 'Expired',
  };
  const cls =
    palette[status] ||
    'bg-gray-100 text-gray-700 border-gray-200 dark:bg-[#1a1a2e] dark:text-[#d4d0dc] dark:border-white/15';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${cls}`}
    >
      {label[status] || status}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [managing, setManaging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stripePortalBanner, setStripePortalBanner] = useState(false);

  useEffect(() => {
    async function loadUserAndStats() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        const [userStats, subRes] = await Promise.all([
          getQuizStats(),
          fetch('/api/users/me/subscription', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : { subscription: null }))
            .catch(() => ({ subscription: null })),
        ]);
        setStats(userStats);
        setSubscription(subRes.subscription || null);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadUserAndStats();
  }, [router]);

  /** After Stripe Billing Portal, user returns with ?from=stripe-portal — refresh subscription row + strip query (avoids blank / stale UI). */
  useEffect(() => {
    if (loading || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') !== 'stripe-portal') return;

    setStripePortalBanner(true);
    fetch('/api/users/me/subscription', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { subscription?: SubscriptionInfo | null } | null) => {
        if (data && 'subscription' in data) {
          setSubscription(data.subscription ?? null);
        }
      })
      .catch(() => {})
      .finally(() => {
        window.history.replaceState({}, '', window.location.pathname);
      });
  }, [loading]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  async function openStripePortal() {
    setManaging(true);
    try {
      const res = await fetch('/api/subscriptions/stripe/portal', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || 'Unable to open billing portal');
    } catch (err: any) {
      alert(err?.message || 'Unable to open billing portal');
    } finally {
      setManaging(false);
    }
  }

  async function cancelPaypal() {
    if (!confirm('Confirm cancellation of your PayPal subscription?')) return;
    setManaging(true);
    try {
      const res = await fetch('/api/subscriptions/paypal/cancel', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(
          'Subscription canceled. You keep access until the end of the current period.'
        );
        window.location.reload();
        return;
      }
      alert(data.error || 'Unable to cancel subscription');
    } catch (err: any) {
      alert(err?.message || 'Unable to cancel subscription');
    } finally {
      setManaging(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 transition-colors dark:from-[#080810] dark:via-[#0c0c18] dark:to-[#12122a]">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/60 bg-white/90 p-10 shadow-xl shadow-gray-200/80 backdrop-blur-md dark:border-white/10 dark:bg-[#111121]/95 dark:shadow-black/40 sm:p-14">
          <LoadingSpinner size="lg" />
          <div className="mt-2 w-full space-y-3">
            <div className="mx-auto h-4 w-48 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90)
      return 'text-green-600 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/40 dark:border-green-500/35';
    if (percentage >= 70)
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-500/35';
    if (percentage >= 50)
      return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-200 dark:bg-yellow-950/35 dark:border-yellow-500/35';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/40 dark:border-red-500/35';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 transition-colors dark:from-[#080810] dark:via-[#0c0c18] dark:to-[#12122a]">
      <div className="container mx-auto px-4 py-8">
        {stripePortalBanner && (
          <div
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/35 dark:text-emerald-100"
            role="status"
          >
            <span>
              You returned from Stripe billing. Subscription details below were refreshed.
            </span>
            <button
              type="button"
              onClick={() => setStripePortalBanner(false)}
              className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-90"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-[#f5f2ff] md:text-5xl">
                Dashboard
              </h1>
              <p className="text-slate-600 dark:text-[#d4d0dc]">Welcome back, {user.name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-200 dark:bg-white/10 dark:text-[#eeeaf4] dark:hover:bg-white/15"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-colors dark:border-white/10 dark:bg-[#111121]/90 dark:shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-indigo-600">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-slate-900 dark:text-[#eeeaf4]">{stats.totalAttempts}</div>
            <div className="text-sm text-slate-600 dark:text-[#9d98ab]">Total Attempts</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-colors dark:border-white/10 dark:bg-[#111121]/90 dark:shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-indigo-600">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-slate-900 dark:text-[#eeeaf4]">{stats.averageScore}%</div>
            <div className="text-sm text-slate-600 dark:text-[#9d98ab]">Average Score</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-colors dark:border-white/10 dark:bg-[#111121]/90 dark:shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-indigo-600">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-slate-900 dark:text-[#eeeaf4]">{stats.passedQuizzes}</div>
            <div className="text-sm text-slate-600 dark:text-[#9d98ab]">Passed Quizzes</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-colors dark:border-white/10 dark:bg-[#111121]/90 dark:shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-indigo-600">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mb-1 text-3xl font-bold text-slate-900 dark:text-[#eeeaf4]">
              {formatDuration(Math.floor(stats.totalTimeSpent / 60))}
            </div>
            <div className="text-sm text-slate-600 dark:text-[#9d98ab]">Time Spent</div>
          </div>
        </div>

        {/* Subscription status */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-colors dark:border-white/10 dark:bg-[#111121]/90 dark:shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-6 dark:border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-[#f5f2ff]">My Subscription</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#9d98ab]">
                {subscription
                  ? subscription.cancelAtPeriodEnd
                    ? 'Cancellation is scheduled. You keep full access until the date shown below.'
                    : 'Details of your active subscription.'
                  : "You don't have a subscription yet."}
              </p>
            </div>
            {!subscription && (
              <Link
                href="/subscribe"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 dark:shadow-[0_4px_20px_rgba(79,70,229,0.35)]"
              >
                Start 48h free trial
              </Link>
            )}
          </div>

          {subscription ? (
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#9d98ab]">Plan</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-[#eeeaf4]">
                  {subscription.plan === 'ALL_ACCESS'
                    ? 'All Access — $25/month'
                    : subscription.plan === 'SINGLE_COURSE'
                    ? 'Single Course — $7/month'
                    : subscription.plan}
                </div>
                {subscription.course && (
                  <div className="mt-1 text-sm text-slate-600 dark:text-[#d4d0dc]">
                    Course:{' '}
                    <Link
                      href={`/quiz/course/${subscription.course.slug}`}
                      className="text-indigo-600 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {subscription.course.title}
                    </Link>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#9d98ab]">Status</div>
                <div className="text-lg font-semibold">
                  <StatusBadge status={subscription.status} />
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-[#9d98ab]">
                  via <span className="capitalize">{subscription.provider}</span>
                  {subscription.cancelAtPeriodEnd ? ' • cancellation scheduled' : ''}
                </div>
              </div>
              {subscription.trialEndsAt && subscription.status === 'trialing' && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#9d98ab]">
                    Trial ends
                  </div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-[#eeeaf4]">
                    {formatDate(subscription.trialEndsAt)}
                  </div>
                </div>
              )}
              {subscription.currentPeriodEnd && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#9d98ab]">
                    {subscription.cancelAtPeriodEnd
                      ? 'Access until'
                      : 'Next billing date'}
                  </div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-[#eeeaf4]">
                    {formatDate(subscription.currentPeriodEnd)}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-2 dark:border-white/10 md:col-span-2">
                {subscription.provider === 'stripe' && (
                  <button
                    type="button"
                    onClick={openStripePortal}
                    disabled={managing}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-60 dark:bg-[#f5c14a] dark:text-[#0c0a00] dark:hover:bg-[#f9d06a]"
                  >
                    {managing ? 'Opening…' : 'Manage / Cancel (Stripe)'}
                  </button>
                )}
                {subscription.provider === 'paypal' && subscription.status !== 'canceled' && (
                  <button
                    type="button"
                    onClick={cancelPaypal}
                    disabled={managing}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-60"
                  >
                    {managing ? 'Canceling…' : 'Cancel PayPal subscription'}
                  </button>
                )}
                <Link
                  href="/subscribe"
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-200 dark:bg-white/10 dark:text-[#eeeaf4] dark:hover:bg-white/15"
                >
                  Change plan
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="mb-4 text-slate-600 dark:text-[#d4d0dc]">
                Unlock access to courses and quizzes with a monthly subscription.
              </p>
              <Link
                href="/subscribe"
                className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                View plans
              </Link>
            </div>
          )}
        </div>

        {/* Quiz History */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-colors dark:border-white/10 dark:bg-[#111121]/90 dark:shadow-black/30">
          <div className="border-b border-slate-200 p-6 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-[#f5f2ff]">Quiz History</h2>
              <Link
                href="/quiz"
                className="flex items-center gap-2 font-semibold text-slate-900 hover:text-slate-700 dark:text-[#f5c14a] dark:hover:text-[#f9d06a]"
              >
                Take New Quiz
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {stats.attempts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-6xl">📝</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-[#f5f2ff]">No quiz attempts yet</h3>
              <p className="mb-6 text-slate-600 dark:text-[#9d98ab]">Start taking quizzes to track your progress!</p>
              <Link href="/quiz" className="btn-primary inline-flex items-center gap-2">
                Browse Quizzes
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {stats.attempts
                .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .map((attempt: any, index: number) => (
                  <div key={index} className="p-6 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-4">
                          <Link
                            href={`/quiz/${attempt.quizSlug}`}
                            className="text-lg font-bold text-slate-900 transition-colors hover:text-indigo-600 dark:text-[#eeeaf4] dark:hover:text-[#f5c14a]"
                          >
                            {attempt.quizTitle}
                          </Link>
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getScoreColor(attempt.percentage)}`}>
                            {attempt.percentage}%
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-[#9d98ab]">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {attempt.correctAnswers} / {attempt.totalQuestions} correct
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(Math.floor(attempt.timeSpent / 60))}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(attempt.completedAt)}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/quiz/${attempt.quizSlug}`}
                        className="ml-4 rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-900 transition-all duration-200 hover:bg-slate-200 dark:bg-white/10 dark:text-[#eeeaf4] dark:hover:bg-white/15"
                      >
                        Retake
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






