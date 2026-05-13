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
        <p className="mb-3 inline-flex rounded-full border border-[#f5c14a]/35 bg-[#f5c14a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-800 dark:border-[#f5c14a]/40 dark:bg-[#f5c14a]/10 dark:text-[#f5c14a]">
          Crack The Curve
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 dark:text-[#f5f2ff] font-['Instrument_Serif',serif]">
          {title}
        </h1>
        <p className="text-lg text-slate-600 dark:text-[#d4d0dc]">{subtitle}</p>
        <p className="text-sm text-slate-500 mt-3 dark:text-[#9d98ab]">
          48h free trial — first charge on{' '}
          <strong className="text-slate-800 dark:text-[#f5c14a]">
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
                  ? 'border-indigo-500 bg-indigo-50/95 shadow-md shadow-indigo-900/10 dark:border-[#f5c14a]/50 dark:bg-[#16162a]/95 dark:shadow-[0_8px_32px_rgba(245,193,74,0.12)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-[#111121]/90 dark:hover:border-white/20'
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-[#f5f2ff]">{plan.label}</h2>
                {isSelected && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-[#f5c14a]">
                    Selected
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-3 dark:text-[#eeeaf4]">
                ${(plan.priceCents / 100).toFixed(0)}
                <span className="text-base font-medium text-slate-500 dark:text-[#9d98ab]">/month</span>
              </div>
              <p className="text-sm text-slate-600 mb-4 dark:text-[#c8c3d2]">{plan.description}</p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-[#d4d0dc]">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-semibold dark:text-emerald-400">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {PLANS[selectedPlan].requiresCourseId && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111121]/90">
          <label
            htmlFor="course-select"
            className="block text-sm font-semibold text-slate-700 mb-2 dark:text-[#d4d0dc]"
          >
            Which course do you want to unlock?
          </label>
          {courses.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-[#9d98ab]">No published courses yet.</p>
          ) : (
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/15 dark:bg-[#0c0c18] dark:text-[#eeeaf4]"
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
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6 text-sm text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-100">
          You need to be signed in to start the trial.{' '}
          <Link
            href={`/login${returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ''}`}
            className="font-semibold underline text-amber-950 dark:text-[#f5c14a]"
          >
            Sign in
          </Link>{' '}
          or{' '}
          <Link
            href={`/register${returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ''}`}
            className="font-semibold underline text-amber-950 dark:text-[#f5c14a]"
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
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-60 dark:shadow-[0_4px_20px_rgba(79,70,229,0.35)]"
        >
          {loadingProvider === 'stripe'
            ? 'Opening Stripe popup…'
            : 'Start 48h trial (card)'}
        </button>
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => startCheckout('paypal')}
          className="inline-flex items-center justify-center rounded-xl bg-[#f5c14a] px-6 py-3 text-[#0c0a00] font-semibold shadow-sm hover:bg-[#f9d06a] disabled:opacity-60"
        >
          {loadingProvider === 'paypal'
            ? 'Opening PayPal popup…'
            : 'Start 48h trial with PayPal'}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-slate-500 dark:text-[#9d98ab]">
        Cancel anytime from your dashboard. No commitment after the trial period.
      </p>
    </section>
  );
}
