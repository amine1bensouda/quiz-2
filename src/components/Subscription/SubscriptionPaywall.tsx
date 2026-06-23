'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PLANS,
  PURCHASABLE_PLAN_IDS,
  formatPlanPrice,
  formatPlanPriceAmount,
  planHighlightsForTrial,
  type PlanId,
} from '@/lib/plans';
import {
  buildAuthUrl,
  type CheckoutProvider,
} from '@/lib/subscription-checkout-url';

interface CourseOption {
  id: string;
  title: string;
  slug: string;
}

interface SubscriptionPaywallProps {
  courses: CourseOption[];
  defaultCourseId?: string | null;
  isAuthenticated: boolean;
  title?: string;
  subtitle?: string;
  returnUrl?: string;
  autoStartCheckout?: CheckoutProvider | null;
}

const DEFAULT_PAYWALL_SUBTITLE = `${formatPlanPrice(PLANS.SINGLE_COURSE)} per course — 48-hour free trial, you only get charged if you continue.`;

export default function SubscriptionPaywall({
  courses,
  defaultCourseId = null,
  isAuthenticated,
  title = 'Unlock access to this content',
  subtitle = DEFAULT_PAYWALL_SUBTITLE,
  returnUrl,
  autoStartCheckout = null,
}: SubscriptionPaywallProps) {
  const autoCheckoutStarted = useRef(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('SINGLE_COURSE');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourseId ?? (courses[0]?.id ?? '')
  );
  const [loadingProvider, setLoadingProvider] = useState<'stripe' | 'paypal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trialEligible, setTrialEligible] = useState(true);
  const [trialChecked, setTrialChecked] = useState(false);

  const firstChargeDate = new Date(Date.now() + 48 * 3600 * 1000);

  useEffect(() => {
    if (!isAuthenticated) {
      setTrialEligible(true);
      setTrialChecked(true);
      return;
    }
    fetch('/api/users/me/trial-eligibility', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { eligible: false }))
      .then((data: { eligible?: boolean }) => {
        setTrialEligible(data.eligible !== false);
        setTrialChecked(true);
      })
      .catch(() => {
        setTrialEligible(false);
        setTrialChecked(true);
      });
  }, [isAuthenticated]);

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
        '<div style="font-family:Arial,sans-serif;padding:24px;background:#080810;color:#eeeaf4">Opening secure payment page...</div>';
      popup.focus();
    }
    return popup;
  }

  const startCheckout = useCallback(
    async (provider: CheckoutProvider, options?: { fullPage?: boolean }) => {
      setError(null);
      const authReturnUrl = returnUrl || '/subscribe';
      const courseForCheckout =
        PLANS[selectedPlan].requiresCourseId ? selectedCourseId : undefined;

      if (!isAuthenticated) {
        window.location.href = buildAuthUrl('login', authReturnUrl, {
          courseId: courseForCheckout,
          provider,
        });
        return;
      }

      const plan = PLANS[selectedPlan];
      if (plan.requiresCourseId && !selectedCourseId) {
        setError('Please pick a course for the Single Course plan.');
        return;
      }

      const useFullPage = options?.fullPage ?? provider === 'stripe';

      setLoadingProvider(provider);
      const pendingPopup = useFullPage ? null : openPendingPopup(provider);
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

        if (useFullPage || provider === 'stripe') {
          if (pendingPopup && !pendingPopup.closed) {
            pendingPopup.close();
          }
          window.location.href = url;
          return;
        }

        if (pendingPopup && !pendingPopup.closed) {
          pendingPopup.location.href = url;
          pendingPopup.focus();
        } else {
          openPaymentPopup(url, provider);
        }
        setLoadingProvider(null);
      } catch (err: unknown) {
        if (pendingPopup && !pendingPopup.closed) {
          pendingPopup.close();
        }
        setError(err instanceof Error ? err.message : 'Unable to start checkout.');
        setLoadingProvider(null);
      }
    },
    [isAuthenticated, returnUrl, selectedCourseId, selectedPlan]
  );

  useEffect(() => {
    if (defaultCourseId) {
      setSelectedCourseId(defaultCourseId);
    }
  }, [defaultCourseId]);

  useEffect(() => {
    if (
      !autoStartCheckout ||
      !isAuthenticated ||
      !trialChecked ||
      autoCheckoutStarted.current
    ) {
      return;
    }

    autoCheckoutStarted.current = true;

    if (returnUrl && typeof window !== 'undefined') {
      window.history.replaceState(null, '', returnUrl);
    }

    void startCheckout(autoStartCheckout, { fullPage: true });
  }, [autoStartCheckout, isAuthenticated, trialChecked, returnUrl, startCheckout]);

  const authReturnUrl = returnUrl || '/subscribe';
  const courseForAuth =
    PLANS[selectedPlan].requiresCourseId
      ? selectedCourseId || defaultCourseId || undefined
      : undefined;

  return (
    <section className="paywall-page relative max-w-5xl mx-auto my-12 px-4">
      <div className="pointer-events-none absolute -left-8 top-0 h-48 w-48 rounded-full bg-[#f5c14a]/8 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-[#b388ff]/8 blur-3xl" />

      <header className="relative text-center mb-10">
        <p className="mb-3 inline-flex rounded-full border border-[#f5c14a]/40 bg-[#f5c14a]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#f5c14a]">
          Crack The Curve
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#eeeaf4] mb-3 font-['Instrument_Serif',serif]">
          {title}
        </h1>
        <p className="text-lg text-[rgba(238,234,244,0.65)]">
          {trialChecked && !trialEligible
            ? `${formatPlanPrice(PLANS.SINGLE_COURSE)} per course — subscribe now, billed immediately.`
            : subtitle}
        </p>
        {trialChecked && trialEligible && (
          <p className="text-sm text-[rgba(238,234,244,0.5)] mt-3">
            One-time 48h free trial per account — first charge on{' '}
            <strong className="text-[#f5c14a]">
              {firstChargeDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </strong>{' '}
            unless you cancel before.
          </p>
        )}
        {trialChecked && !trialEligible && (
          <p className="text-sm text-amber-200/90 mt-3">
            You have already used your free trial on this account.
          </p>
        )}
      </header>

      <div className="relative grid gap-6 mb-8 max-w-xl mx-auto">
        {PURCHASABLE_PLAN_IDS.map((key) => {
          const plan = PLANS[key];
          const isSelected = selectedPlan === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPlan(key)}
              className={`text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
                isSelected
                  ? 'border-[#f5c14a]/50 bg-[#12121f]/95 shadow-[0_8px_32px_rgba(245,193,74,0.12)]'
                  : 'border-white/10 bg-[#111121]/90 hover:border-white/20 hover:bg-[#12121f]/80'
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-xl font-semibold text-[#eeeaf4]">{plan.label}</h2>
                {isSelected && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#f5c14a]">
                    Selected
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-[#eeeaf4] mb-3">
                ${formatPlanPriceAmount(plan)}
                <span className="text-base font-medium text-[rgba(238,234,244,0.5)]">/month</span>
              </div>
              <p className="text-sm text-[rgba(238,234,244,0.65)] mb-4">{plan.description}</p>
              <ul className="space-y-2 text-sm text-[rgba(238,234,244,0.75)]">
                {planHighlightsForTrial(plan, trialEligible).map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <span className="text-[#2be4c8] font-semibold">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {PLANS[selectedPlan].requiresCourseId && (
        <div className="relative mb-8 rounded-xl border border-white/10 bg-[#111121]/90 p-5 backdrop-blur-sm">
          <label
            htmlFor="course-select"
            className="block text-sm font-semibold text-[rgba(238,234,244,0.9)] mb-2"
          >
            Which course do you want to unlock?
          </label>
          {courses.length === 0 ? (
            <p className="text-sm text-[rgba(238,234,244,0.5)]">No published courses yet.</p>
          ) : (
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0e0e1a] px-4 py-3 text-[#eeeaf4] focus:border-[#f5c14a]/60 focus:outline-none focus:ring-2 focus:ring-[#f5c14a]/20"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0e0e1a]">
                  {c.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && (
        <div className="relative mb-6 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!isAuthenticated ? (
        <div className="relative rounded-xl border border-amber-500/35 bg-amber-950/35 px-5 py-4 mb-6 text-sm text-amber-100">
          You need to be signed in to start the trial.{' '}
          <Link
            href={buildAuthUrl('login', authReturnUrl, {
              courseId: courseForAuth,
              provider: 'stripe',
            })}
            className="font-semibold underline text-[#f5c14a]"
          >
            Sign in
          </Link>{' '}
          or{' '}
          <Link
            href={buildAuthUrl('register', authReturnUrl, {
              courseId: courseForAuth,
              provider: 'stripe',
            })}
            className="font-semibold underline text-[#f5c14a]"
          >
            create an account
          </Link>
          .
        </div>
      ) : null}

      <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => startCheckout('stripe')}
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-[#0c0a00] font-semibold transition-colors disabled:opacity-60 bg-[#f5c14a] hover:bg-[#f9d06a] shadow-[0_4px_20px_rgba(245,193,74,0.24)]"
        >
          {loadingProvider === 'stripe'
            ? 'Opening Stripe…'
            : trialEligible
              ? 'Start 48h trial (card)'
              : 'Subscribe with card'}
        </button>
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => startCheckout('paypal')}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-[#12121f] px-6 py-3 text-[#eeeaf4] font-semibold transition-colors hover:border-white/25 hover:bg-[#16162a] disabled:opacity-60"
        >
          {loadingProvider === 'paypal'
            ? 'Opening PayPal…'
            : trialEligible
              ? 'Start 48h trial with PayPal'
              : 'Subscribe with PayPal'}
        </button>
      </div>

      <p className="relative mt-8 text-center text-xs text-[rgba(238,234,244,0.45)]">
        Cancel anytime from your dashboard. No commitment after the trial period.
      </p>
    </section>
  );
}
