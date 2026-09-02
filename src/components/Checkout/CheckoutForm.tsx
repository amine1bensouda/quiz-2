'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeCheckoutFormConfirmEvent } from '@stripe/stripe-js';
import {
  CheckoutForm as StripeCheckoutForm,
  CheckoutFormProvider,
  useCheckoutForm,
} from '@stripe/react-stripe-js/checkout';
import {
  PLANS,
  formatPlanPrice,
  formatPlanPriceAmount,
  getTrialLongLabel,
  getTrialSeconds,
  planHighlightsForTrial,
} from '@/lib/plans';
import { SITE_NAME } from '@/lib/constants';
import { getStripeCheckoutAppearance } from '@/lib/stripe-checkout-branding';

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

function formatRenewalDate(): string {
  const date = new Date(Date.now() + getTrialSeconds() * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function StripePaymentForm() {
  const checkoutState = useCheckoutForm();

  const onConfirm = useCallback(
    async (event: StripeCheckoutFormConfirmEvent) => {
      if (checkoutState.type !== 'success') return;
      try {
        await checkoutState.checkout.confirm({
          formConfirmEvent: event,
          redirect: 'if_required',
        });
      } catch (err: unknown) {
        console.error('Stripe payment confirmation error:', err);
      }
    },
    [checkoutState]
  );

  if (checkoutState.type === 'error') {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
        {checkoutState.error.message}
      </div>
    );
  }

  if (checkoutState.type === 'loading') {
    return (
      <div className="checkout-muted py-8 text-center text-sm">
        Loading secure payment…
      </div>
    );
  }

  return <StripeCheckoutForm onConfirm={onConfirm} />;
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
  const [appliedPromo, setAppliedPromo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(Boolean(initialUser));
  const [checkoutKey, setCheckoutKey] = useState(0);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const withTrial = trialEligible;
  const priceLabel = `$${formatPlanPriceAmount(plan)}`;

  const productTitle = selectedCourse
    ? `${SITE_NAME}: ${selectedCourse.title}`
    : `${SITE_NAME}: ${plan.label}`;

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/subscriptions/stripe/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        plan: 'SINGLE_COURSE',
        courseId: selectedCourseId,
        promoCode: appliedPromo || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Error ${res.status}`);
    }
    if (!data.clientSecret) {
      throw new Error('Unable to start secure payment. Please try again.');
    }
    return data.clientSecret as string;
  }, [selectedCourseId, appliedPromo]);

  const stripeCheckoutOptions = useMemo(
    () => ({
      clientSecret: fetchClientSecret(),
      appearance: getStripeCheckoutAppearance(),
    }),
    [fetchClientSecret]
  );

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
      setPaymentReady(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to continue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page relative mx-auto w-full max-w-6xl px-4 lg:px-8">
      <div className="checkout-card rounded-2xl p-8 shadow-2xl md:p-10">
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
              className="checkout-complete-btn mt-6 w-full rounded-xl py-3 text-base font-semibold disabled:opacity-60"
            >
              {loading ? 'Please wait…' : 'Continue to payment'}
            </button>
          </section>
        )}

        {user && (
          <section className="mb-8">
            <p className="checkout-muted text-sm">
              Signed in as{' '}
              <strong className="text-[#eeeaf4]">{user.email}</strong>
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
                setPaymentReady(false);
                setCheckoutKey((key) => key + 1);
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
            <h2 className="checkout-section-title text-xl font-semibold">Payment</h2>
            <span className="checkout-muted text-xs">Powered by Stripe</span>
          </div>

          {!user ? (
            <div className="checkout-summary rounded-xl px-4 py-5 text-sm checkout-muted">
              Enter your account details above to unlock the secure payment form.
            </div>
          ) : !paymentReady ? (
            <button
              type="button"
              onClick={handlePreparePayment}
              disabled={loading || !selectedCourseId}
              className="checkout-complete-btn w-full rounded-xl py-3 text-base font-semibold disabled:opacity-60"
            >
              {loading ? 'Please wait…' : 'Continue to payment'}
            </button>
          ) : (
            <div className="checkout-payment-element">
              <CheckoutFormProvider
                key={`${checkoutKey}-${selectedCourseId}-${appliedPromo}`}
                stripe={stripePromise}
                options={stripeCheckoutOptions}
              >
                <StripePaymentForm />
              </CheckoutFormProvider>
            </div>
          )}
        </section>

        <hr className="checkout-divider my-8" />

        <section>
          <h2 className="checkout-section-title mb-4 text-xl font-semibold">
            Confirmation
          </h2>

          <div className="checkout-summary rounded-xl p-5">
            <h3 className="text-lg font-bold text-[#eeeaf4]">{productTitle}</h3>
            {withTrial ? (
              <p className="checkout-muted mt-1 text-sm">
                {getTrialLongLabel()}. First charge on {formatRenewalDate()}
              </p>
            ) : (
              <p className="checkout-muted mt-1 text-sm">Billed immediately</p>
            )}
            <p className="mt-4 text-2xl font-bold text-[#eeeaf4]">
              <span className="checkout-muted">»</span>{' '}
              <span className="checkout-price">{priceLabel}</span>
              <span className="checkout-muted text-base font-medium">/month</span>
            </p>
            <ul className="checkout-muted mt-4 space-y-1 text-sm">
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
                onClick={() => {
                  setAppliedPromo(promoCode.trim());
                  setPaymentReady(true);
                  setCheckoutKey((key) => key + 1);
                }}
                disabled={!user}
                className="checkout-secondary-btn px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <p className="checkout-muted mt-8 text-center text-sm">
          {formatPlanPrice(plan)} · Cancel anytime from your dashboard
        </p>
      </div>
    </div>
  );
}
