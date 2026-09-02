'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PLANS,
  PURCHASABLE_PLAN_IDS,
  formatPlanPrice,
  formatPlanPriceAmount,
  getTrialLongLabel,
  getTrialMinutes,
  getTrialShortLabel,
  getTrialSeconds,
  planHighlightsForTrial,
  type PlanId,
} from '@/lib/plans';
import type { CheckoutProvider } from '@/lib/subscription-checkout-url';

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
  existingSubscriptionCourseTitle?: string | null;
}

function defaultPaywallSubtitle(): string {
  return `${formatPlanPrice(PLANS.SINGLE_COURSE)} per course. ${getTrialLongLabel()}, you only get charged if you continue.`;
}

function buildCheckoutHref(courseId?: string): string {
  if (courseId) {
    return `/checkout?courseId=${encodeURIComponent(courseId)}`;
  }
  return '/checkout';
}

export default function SubscriptionPaywall({
  courses,
  defaultCourseId = null,
  title = 'Unlock access to this content',
  subtitle = defaultPaywallSubtitle(),
  autoStartCheckout = null,
  existingSubscriptionCourseTitle = null,
}: SubscriptionPaywallProps) {
  const autoCheckoutStarted = useRef(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('SINGLE_COURSE');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    defaultCourseId ?? (courses[0]?.id ?? '')
  );
  const [trialEligible, setTrialEligible] = useState(true);
  const [trialChecked, setTrialChecked] = useState(false);

  const firstChargeDate = new Date(Date.now() + getTrialSeconds() * 1000);
  const trialShort = getTrialShortLabel();

  const checkoutHref = useMemo(() => {
    const courseId = PLANS[selectedPlan].requiresCourseId ? selectedCourseId : undefined;
    return buildCheckoutHref(courseId);
  }, [selectedPlan, selectedCourseId]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (defaultCourseId) {
      setSelectedCourseId(defaultCourseId);
    }
  }, [defaultCourseId]);

  useEffect(() => {
    if (!autoStartCheckout || autoCheckoutStarted.current) {
      return;
    }

    autoCheckoutStarted.current = true;
    const courseId = PLANS[selectedPlan].requiresCourseId ? selectedCourseId : undefined;
    window.location.href = buildCheckoutHref(courseId);
  }, [autoStartCheckout, selectedCourseId, selectedPlan]);

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
            ? `${formatPlanPrice(PLANS.SINGLE_COURSE)} per course. Subscribe now, billed immediately.`
            : subtitle}
        </p>
        {trialChecked && trialEligible && (
          <p className="text-sm text-[rgba(238,234,244,0.5)] mt-3">
            One-time {trialShort} per account. First charge on{' '}
            <strong className="text-[#f5c14a]">
              {getTrialMinutes() < 60
                ? firstChargeDate.toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : firstChargeDate.toLocaleDateString('en-US', {
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
            You have already used your free trial on this account. You will be
            charged immediately. No new trial.
          </p>
        )}
      </header>

      {existingSubscriptionCourseTitle && (
        <div className="relative mb-8 max-w-xl mx-auto rounded-xl border border-amber-500/35 bg-amber-950/35 px-5 py-4 text-sm text-amber-100">
          You are currently subscribed to{' '}
          <strong className="text-[#f5c14a]">{existingSubscriptionCourseTitle}</strong>.
          Cancel that plan from your{' '}
          <Link href="/dashboard#profile" className="font-semibold underline text-[#f5c14a]">
            dashboard
          </Link>{' '}
          before subscribing to another course.
        </div>
      )}

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

      <div className="relative flex justify-center">
        <Link
          href={checkoutHref}
          className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-[#0c0a00] font-semibold transition-colors bg-[#f5c14a] hover:bg-[#f9d06a] shadow-[0_4px_20px_rgba(245,193,74,0.24)] disabled:pointer-events-none disabled:opacity-60"
          aria-disabled={PLANS[selectedPlan].requiresCourseId && !selectedCourseId}
          onClick={(e) => {
            if (PLANS[selectedPlan].requiresCourseId && !selectedCourseId) {
              e.preventDefault();
            }
          }}
        >
          {trialEligible ? `Start ${trialShort}` : 'Continue to checkout'}
        </Link>
      </div>

      <p className="relative mt-8 text-center text-xs text-[rgba(238,234,244,0.45)]">
        Cancel anytime from your dashboard. No commitment after the trial period.
      </p>
    </section>
  );
}
