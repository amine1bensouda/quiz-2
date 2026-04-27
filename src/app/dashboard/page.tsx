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
    trialing: 'bg-blue-100 text-blue-800 border-blue-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    past_due: 'bg-amber-100 text-amber-800 border-amber-200',
    incomplete: 'bg-gray-100 text-gray-700 border-gray-200',
    canceled: 'bg-red-100 text-red-700 border-red-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
  };
  const label: Record<string, string> = {
    trialing: 'Trial active',
    active: 'Active',
    past_due: 'Past due',
    incomplete: 'Incomplete',
    canceled: 'Canceled',
    expired: 'Expired',
  };
  const cls = palette[status] || 'bg-gray-100 text-gray-700 border-gray-200';
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
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/80 border border-white/60 p-10 sm:p-14 flex flex-col items-center gap-6">
          <LoadingSpinner size="lg" />
          <div className="w-full space-y-3 mt-2">
            <div className="h-4 w-48 bg-gray-200 rounded-full animate-pulse mx-auto" />
            <div className="h-3 w-36 bg-gray-100 rounded-full animate-pulse mx-auto" />
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
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, {user.name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAttempts}</div>
            <div className="text-sm text-gray-600">Total Attempts</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.averageScore}%</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.passedQuizzes}</div>
            <div className="text-sm text-gray-600">Passed Quizzes</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatDuration(Math.floor(stats.totalTimeSpent / 60))}
            </div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </div>
        </div>

        {/* Subscription status */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Subscription</h2>
              <p className="text-sm text-gray-600 mt-1">
                {subscription
                  ? 'Details of your active subscription.'
                  : "You don't have a subscription yet."}
              </p>
            </div>
            {!subscription && (
              <Link
                href="/subscribe"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm"
              >
                Start 48h free trial
              </Link>
            )}
          </div>

          {subscription ? (
            <div className="p-6 grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Plan</div>
                <div className="text-lg font-semibold text-gray-900">
                  {subscription.plan === 'ALL_ACCESS'
                    ? 'All Access — $25/month'
                    : subscription.plan === 'SINGLE_COURSE'
                    ? 'Single Course — $7/month'
                    : subscription.plan}
                </div>
                {subscription.course && (
                  <div className="text-sm text-gray-600 mt-1">
                    Course:{' '}
                    <Link
                      href={`/quiz/course/${subscription.course.slug}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {subscription.course.title}
                    </Link>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                <div className="text-lg font-semibold">
                  <StatusBadge status={subscription.status} />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  via <span className="capitalize">{subscription.provider}</span>
                  {subscription.cancelAtPeriodEnd ? ' • cancellation scheduled' : ''}
                </div>
              </div>
              {subscription.trialEndsAt && subscription.status === 'trialing' && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Trial ends
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(subscription.trialEndsAt)}
                  </div>
                </div>
              )}
              {subscription.currentPeriodEnd && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    {subscription.cancelAtPeriodEnd
                      ? 'Access until'
                      : 'Next billing date'}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(subscription.currentPeriodEnd)}
                  </div>
                </div>
              )}
              <div className="md:col-span-2 flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                {subscription.provider === 'stripe' && (
                  <button
                    type="button"
                    onClick={openStripePortal}
                    disabled={managing}
                    className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-all disabled:opacity-60"
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
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-all"
                >
                  Change plan
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                Unlock access to courses and quizzes with a monthly subscription.
              </p>
              <Link
                href="/subscribe"
                className="inline-block px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                View plans
              </Link>
            </div>
          )}
        </div>

        {/* Quiz History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Quiz History</h2>
              <Link
                href="/quiz"
                className="text-gray-900 hover:text-gray-700 font-semibold flex items-center gap-2"
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
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quiz attempts yet</h3>
              <p className="text-gray-600 mb-6">Start taking quizzes to track your progress!</p>
              <Link href="/quiz" className="btn-primary inline-flex items-center gap-2">
                Browse Quizzes
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {stats.attempts
                .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .map((attempt: any, index: number) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <Link
                            href={`/quiz/${attempt.quizSlug}`}
                            className="text-lg font-bold text-gray-900 hover:text-gray-700 transition-colors"
                          >
                            {attempt.quizTitle}
                          </Link>
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getScoreColor(attempt.percentage)}`}>
                            {attempt.percentage}%
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
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
                        className="ml-4 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold transition-all duration-200"
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






