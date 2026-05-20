/**
 * Central subscription plan configuration.
 *
 * Fixed price:
 *  - SINGLE_COURSE: $7/month — access to one course of your choice.
 *
 * `ALL_ACCESS` is kept for legacy subscriptions already in the database.
 *
 * Trial: 48 hours free; payment method collected up front.
 * First charge at `now + TRIAL_HOURS`.
 */

export const TRIAL_HOURS = 48;
export const TRIAL_SECONDS = TRIAL_HOURS * 60 * 60;
export const CURRENCY = 'USD';
export const BILLING_INTERVAL = 'month' as const;

export type PlanId = 'SINGLE_COURSE' | 'ALL_ACCESS';

/** Plans available for new sign-ups (checkout / paywall). */
export const PURCHASABLE_PLAN_IDS: PlanId[] = ['SINGLE_COURSE'];

export interface PlanDefinition {
  id: PlanId;
  label: string;
  priceCents: number;
  requiresCourseId: boolean;
  stripePriceId: string | undefined;
  paypalPlanId: string | undefined;
  /** PayPal plan without trial cycle (for returning subscribers). */
  paypalPlanIdNoTrial: string | undefined;
  description: string;
  highlights: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  SINGLE_COURSE: {
    id: 'SINGLE_COURSE',
    label: 'Single Course',
    priceCents: 700,
    requiresCourseId: true,
    stripePriceId: process.env.STRIPE_PRICE_SINGLE_COURSE_ID,
    paypalPlanId: process.env.PAYPAL_PLAN_SINGLE_COURSE_ID,
    paypalPlanIdNoTrial: process.env.PAYPAL_PLAN_SINGLE_COURSE_NO_TRIAL_ID,
    description: 'Full access to a single course of your choice.',
    highlights: [
      'One course of your choice',
      'All modules, lessons and quizzes in the course',
      '48h free trial',
      'Cancel anytime',
    ],
  },
  ALL_ACCESS: {
    id: 'ALL_ACCESS',
    label: 'All Access',
    priceCents: 2500,
    requiresCourseId: false,
    stripePriceId: process.env.STRIPE_PRICE_ALL_ACCESS_ID,
    paypalPlanId: process.env.PAYPAL_PLAN_ALL_ACCESS_ID,
    paypalPlanIdNoTrial: process.env.PAYPAL_PLAN_ALL_ACCESS_NO_TRIAL_ID,
    description: 'Unlimited access to the whole catalog.',
    highlights: [
      'All current and upcoming courses',
      'All quizzes (including standalone ones)',
      '48h free trial',
      'Cancel anytime',
    ],
  },
};

export function getPlan(plan: string | null | undefined): PlanDefinition | null {
  if (plan === 'SINGLE_COURSE' || plan === 'ALL_ACCESS') {
    return PLANS[plan];
  }
  return null;
}

export function isPurchasablePlan(plan: string | null | undefined): plan is PlanId {
  return !!plan && (PURCHASABLE_PLAN_IDS as readonly string[]).includes(plan);
}

export function getPurchasablePlan(plan: string | null | undefined): PlanDefinition | null {
  if (!isPurchasablePlan(plan)) return null;
  return PLANS[plan];
}

/** PayPal billing plan id — with or without the built-in trial cycle. */
export function getPaypalPlanId(plan: PlanDefinition, withTrial: boolean): string | undefined {
  if (withTrial) return plan.paypalPlanId;
  return plan.paypalPlanIdNoTrial ?? plan.paypalPlanId;
}

export function planHighlightsForTrial(
  plan: PlanDefinition,
  withTrial: boolean
): string[] {
  if (withTrial) return plan.highlights;
  return plan.highlights.map((h) =>
    h === '48h free trial' ? 'Billed immediately' : h
  );
}

export function formatPlanPrice(plan: PlanDefinition): string {
  const dollars = (plan.priceCents / 100).toFixed(plan.priceCents % 100 === 0 ? 0 : 2);
  return `$${dollars}/month`;
}

/**
 * Subscription statuses that still grant access.
 * `trialing` = within the 48h trial. `active` = after first successful payment.
 * `past_due` is lenient: user keeps access while the provider retries billing;
 * webhooks eventually move the row to `canceled` / `expired`.
 */
export const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due'] as const;
export type ActiveSubscriptionStatus = (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number];

export function isActiveStatus(status: string | null | undefined): boolean {
  return !!status && (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

/** Normalized provider codes for `Subscription.provider`. */
export const SUBSCRIPTION_PROVIDERS = ['stripe', 'paypal'] as const;
export type SubscriptionProvider = (typeof SUBSCRIPTION_PROVIDERS)[number];
