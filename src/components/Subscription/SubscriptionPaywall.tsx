'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PLANS, type PlanId } from '@/lib/plans';

interface CourseOption {
  id: string;
  title: string;
  slug: string;
}

interface SubscriptionPaywallProps {
  /** Published courses shown in the SINGLE_COURSE selector */
  courses: CourseOption[];
  /** Pre-selected course when the user lands from a specific course */
  defaultCourseId?: string | null;
  /** Whether the user is logged in. If not, show login/register links */
  isAuthenticated: boolean;
  /** Contextual title (e.g. "Unlock this quiz", "Unlock this course") */
  title?: string;
  /** Contextual subtitle */
  subtitle?: string;
  /** Return URL after login (to land back on the protected page) */
  returnUrl?: string;
}

export default function SubscriptionPaywall({
  courses,
  defaultCourseId = null,
  isAuthenticated,
  title = 'Unlock access to this content',
  subtitle = 'Pick a plan — 48-hour free trial, you only get charged if you continue.',
  returnUrl,
}: SubscriptionPaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    defaultCourseId ? 'SINGLE_COURSE' : 'ALL_ACCESS'
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourseId ?? (courses[0]?.id ?? '')
  );
  const [loadingProvider, setLoadingProvider] = useState<'stripe' | 'paypal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firstChargeDate = new Date(Date.now() + 48 * 3600 * 1000);

  function openPaymentPopup(url: string, provider: 'stripe' | 'paypal') {
    const popupWidth = 520;
    const popupHeight = 760;
    const left = Math.max(0, Math.round((window.screen.width - popupWidth) / 2));
    const top = Math.max(0, Math.round((window.screen.height - popupHeight) / 2));

    const popup = window.open(
      url,
      `${provider}-checkout`,
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    // Si le navigateur bloque la popup, fallback vers redirection classique.
    if (!popup) {
      window.location.href = url;
      return;
    }
    popup.focus();
  }

  function openPendingPopup(provider: 'stripe' | 'paypal') {
    const popupWidth = 520;
    const popupHeight = 760;
    const left = Math.max(0, Math.round((window.screen.width - popupWidth) / 2));
    const top = Math.max(0, Math.round((window.screen.height - popupHeight) / 2));
    const popup = window.open(
      '',
      `${provider}-checkout`,
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    if (popup) {
      popup.document.title = 'Loading payment...';
      popup.document.body.innerHTML =
        '<div style="font-family:Arial,sans-serif;padding:24px">Opening secure payment page...</div>';
      popup.focus();
    }
    return popup;
  }

  async function startCheckout(provider: 'stripe' | 'paypal') {
    setError(null);
    if (!isAuthenticated) {
      const login = returnUrl
        ? `/login?redirect=${encodeURIComponent(returnUrl)}`
        : '/login';
      window.location.href = login;
      return;
    }

    const plan = PLANS[selectedPlan];
    if (plan.requiresCourseId && !selectedCourseId) {
      setError('Please pick a course for the Single Course plan.');
      return;
    }

    setLoadingProvider(provider);
    const pendingPopup = openPendingPopup(provider);
    try {
      const endpoint =
        provider === 'stripe'
          ? '/api/subscriptions/stripe/checkout'
          : '/api/subscriptions/paypal/subscribe';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          courseId: plan.requiresCourseId ? selectedCourseId : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }
      const url = provider === 'stripe' ? data.url : data.approveUrl;
      if (!url) throw new Error('Payment provider returned no URL.');
      if (pendingPopup && !pendingPopup.closed) {
        pendingPopup.location.href = url;
        pendingPopup.focus();
      } else {
        openPaymentPopup(url, provider);
      }
      setLoadingProvider(null);
    } catch (err: any) {
      if (pendingPopup && !pendingPopup.closed) {
        pendingPopup.close();
      }
      setError(err?.message || 'Unable to start checkout.');
      setLoadingProvider(null);
    }
  }

  return (
    <section className="max-w-5xl mx-auto my-12 px-4">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-lg text-gray-600">{subtitle}</p>
        <p className="text-sm text-gray-500 mt-3">
          48h free trial — first charge on{' '}
          <strong className="text-gray-800">
            {firstChargeDate.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </strong>{' '}
          unless you cancel before.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {(Object.keys(PLANS) as PlanId[]).map((key) => {
          const plan = PLANS[key];
          const isSelected = selectedPlan === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPlan(key)}
              className={`text-left rounded-2xl border-2 p-6 transition shadow-sm hover:shadow-md ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{plan.label}</h2>
                {isSelected && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Selected
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-3">
                ${(plan.priceCents / 100).toFixed(0)}
                <span className="text-base font-medium text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <span className="text-green-600 font-semibold">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {PLANS[selectedPlan].requiresCourseId && (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-5">
          <label
            htmlFor="course-select"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Which course do you want to unlock?
          </label>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500">No published courses yet.</p>
          ) : (
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6 text-sm text-amber-800">
          You need to be signed in to start the trial.{' '}
          <Link
            href={`/login${returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ''}`}
            className="font-semibold underline"
          >
            Sign in
          </Link>{' '}
          or{' '}
          <Link
            href={`/register${returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ''}`}
            className="font-semibold underline"
          >
            create an account
          </Link>
          .
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => startCheckout('stripe')}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loadingProvider === 'stripe'
            ? 'Opening Stripe popup…'
            : 'Start 48h trial (card)'}
        </button>
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => startCheckout('paypal')}
          className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-gray-900 font-semibold shadow-sm hover:bg-yellow-300 disabled:opacity-60"
        >
          {loadingProvider === 'paypal'
            ? 'Opening PayPal popup…'
            : 'Start 48h trial with PayPal'}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        Cancel anytime from your dashboard. No commitment after the trial period.
      </p>
    </section>
  );
}
