'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import {
  PLANS,
  formatPlanPrice,
  formatPlanPriceAmount,
  getTrialLongLabel,
  getTrialSeconds,
  planHighlightsForTrial,
} from '@/lib/plans';
import { SITE_NAME } from '@/lib/constants';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

type CourseOption = {
  id: string;
  title: string;
  slug: string;
};

type CheckoutUser = {
  id: string;
  email: string;
  name: string;
};

interface CheckoutFormProps {
  courses: CourseOption[];
  defaultCourseId: string | null;
  initialUser: CheckoutUser | null;
  trialEligible: boolean;
}

type IntentResponse = {
  clientSecret: string;
  withTrial: boolean;
};

function formatRenewalDate(): string {
  const date = new Date(Date.now() + getTrialSeconds() * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CheckoutForm({
  courses,
  defaultCourseId,
  initialUser,
  trialEligible,
}: CheckoutFormProps) {
  const router = useRouter();
  const plan = PLANS.SINGLE_COURSE;

  const [user, setUser] = useState<CheckoutUser | null>(initialUser);
  const [name, setName] = useState(initialUser?.name ?? '');
  const [email, setEmail] = useState(initialUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(
    defaultCourseId ?? courses[0]?.id ?? ''
  );
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const withTrial = trialEligible;
  const priceLabel = `$${formatPlanPriceAmount(plan)}`;

  const productTitle = selectedCourse
    ? `${SITE_NAME} — ${selectedCourse.title}`
    : `${SITE_NAME} — ${plan.label}`;

  const loadIntent = useCallback(async () => {
    if (!user || !selectedCourseId) return;
    setIntentLoading(true);
    setError('');
    try {
      const res = await fetch('/api/subscriptions/stripe/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan: 'SINGLE_COURSE',
          courseId: selectedCourseId,
          promoCode: promoCode.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }
      if (data.completed) {
        window.location.href = '/dashboard?subscription=success';
        return;
      }
      if (!data.clientSecret) {
        throw new Error('Stripe did not return a payment client secret.');
      }
      setIntent({
        clientSecret: data.clientSecret,
        withTrial: data.withTrial !== false,
      });
    } catch (err: unknown) {
      setIntent(null);
      setError(err instanceof Error ? err.message : 'Unable to load payment form.');
    } finally {
      setIntentLoading(false);
    }
  }, [user, selectedCourseId, promoCode]);

  useEffect(() => {
    if (user && selectedCourseId) {
      void loadIntent();
    } else {
      setIntent(null);
    }
  }, [user, selectedCourseId, loadIntent]);

  const ensureAccount = async () => {
    if (user) return user;

    const res = await fetch('/api/checkout/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        confirmPassword,
        name,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Account step failed');
    }
    const nextUser = data.user as CheckoutUser;
    setUser(nextUser);
    router.refresh();
    return nextUser;
  };

  const handlePreparePayment = async () => {
    setError('');
    setLoading(true);
    try {
      await ensureAccount();
      if (!selectedCourseId) {
        throw new Error('Please select a course.');
      }
      await loadIntent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to continue.');
    } finally {
      setLoading(false);
    }
  };

  const embeddedCheckoutOptions = useMemo(() => {
    if (!intent?.clientSecret) return null;
    return { clientSecret: intent.clientSecret };
  }, [intent?.clientSecret]);

  return (
    <div className="checkout-page mx-auto max-w-3xl px-4 py-10">
      <div className="checkout-card rounded-sm border border-dashed border-[#c5ccd3] bg-white p-8 shadow-sm md:p-10">
        <h1 className="checkout-title mb-8 text-3xl font-semibold leading-tight md:text-4xl">
          Purchase {productTitle}
        </h1>

        {!user && (
          <section className="mb-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="checkout-name" className="checkout-label">
                  Full Name
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="checkout-input"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="checkout-email" className="checkout-label">
                  Email Address
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="checkout-input"
                  placeholder="your.email@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="checkout-password" className="checkout-label">
                  Password
                </label>
                <input
                  id="checkout-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="checkout-input"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="checkout-confirm" className="checkout-label">
                  Confirm Password
                </label>
                <input
                  id="checkout-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="checkout-input"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreparePayment}
              disabled={loading || !email || !password || !confirmPassword || !name}
              className="checkout-complete-btn mt-6 w-full rounded-md py-3 text-base font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Please wait…' : 'Continue to payment'}
            </button>
          </section>
        )}

        {user && (
          <section className="mb-8">
            <p className="text-sm text-[#4b5563]">
              Signed in as <strong className="text-[#111827]">{user.email}</strong>
            </p>
          </section>
        )}

        {courses.length > 0 && (
          <section className="mb-8">
            <label htmlFor="checkout-course" className="checkout-label">
              Course
            </label>
            <select
              id="checkout-course"
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setIntent(null);
              }}
              className="checkout-input"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </section>
        )}

        <hr className="checkout-divider my-8" />

        <section className="mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-[#1f2937]">Payment</h2>
            <span className="text-xs text-[#6b7280]">Powered by Stripe</span>
          </div>

          {!user ? (
            <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-4 py-5 text-sm text-[#6b7280]">
              Enter your account details above to unlock the secure payment form.
            </div>
          ) : intentLoading && !intent ? (
            <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-4 py-8 text-center text-sm text-[#6b7280]">
              Loading secure payment form…
            </div>
          ) : embeddedCheckoutOptions && intent ? (
            <div className="checkout-payment-element overflow-hidden rounded-lg border border-[#d8dde3] bg-white">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={embeddedCheckoutOptions}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePreparePayment}
              disabled={loading || !selectedCourseId}
              className="checkout-complete-btn w-full rounded-md py-3 text-base font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Please wait…' : 'Continue to payment'}
            </button>
          )}
        </section>

        <hr className="checkout-divider my-8" />

        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#1f2937]">Confirmation</h2>

          <div className="rounded-md border border-[#e5e7eb] bg-[#fafafa] p-5">
            <h3 className="text-lg font-bold text-[#111827]">{productTitle}</h3>
            {withTrial ? (
              <p className="mt-1 text-sm text-[#6b7280]">
                {getTrialLongLabel()} — first charge on {formatRenewalDate()}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#6b7280]">Billed immediately</p>
            )}
            <p className="mt-4 text-2xl font-bold text-[#111827]">
              <span className="text-[#9ca3af]">»</span> {priceLabel}
              <span className="text-base font-medium text-[#6b7280]">/month</span>
            </p>
            <ul className="mt-4 space-y-1 text-sm text-[#4b5563]">
              {planHighlightsForTrial(plan, withTrial).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <label htmlFor="checkout-promo" className="checkout-label">
              Promo Code
            </label>
            <div className="flex gap-2">
              <input
                id="checkout-promo"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="checkout-input max-w-xs"
                placeholder="Optional"
              />
              <button
                type="button"
                onClick={() => void loadIntent()}
                disabled={!user || intentLoading}
                className="rounded-md border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-[#6b7280]">
          {formatPlanPrice(plan)} · Cancel anytime from your dashboard
        </p>
      </div>
    </div>
  );
}
