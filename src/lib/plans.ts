/**
 * Central subscription plan configuration.
 *
 * Fixed price:
 *  - SINGLE_COURSE: $0.50/month — access to one course of your choice.
 *
 * `ALL_ACCESS` is kept for legacy subscriptions already in the database.
 *
 * Trial duration: `TRIAL_DURATION_MINUTES` in .env (default 48 h = 2880 min).
 * Test rapide : TRIAL_DURATION_MINUTES=5
 */

const DEFAULT_TRIAL_MINUTES = 48 * 60;

/** Lit TRIAL_DURATION_MINUTES (serveur) ou NEXT_PUBLIC_TRIAL_DURATION_MINUTES (UI). */
export function getTrialMinutes(): number {
  const raw =
    process.env.TRIAL_DURATION_MINUTES?.trim() ||
    process.env.NEXT_PUBLIC_TRIAL_DURATION_MINUTES?.trim() ||
    '';
  const minutes = parseInt(raw, 10);
  if (!Number.isNaN(minutes) && minutes > 0) return minutes;
  return DEFAULT_TRIAL_MINUTES;
}

export function getTrialSeconds(): number {
  return getTrialMinutes() * 60;
}

export function getTrialHours(): number {
  return getTrialSeconds() / 3600;
}

/** Fenêtre max pour détecter une fin d'essai (évite la fin de mois Stripe). */
export function getTrialWindowMaxMs(): number {
  const trialMs = getTrialSeconds() * 1000;
  return trialMs + Math.min(trialMs * 0.5, 6 * 60 * 60 * 1000);
}

export function getTrialShortLabel(): string {
  const minutes = getTrialMinutes();
  if (minutes < 60) return `${minutes} min free trial`;
  if (minutes < 24 * 60) {
    const hours = Math.round(minutes / 60);
    return `${hours}h free trial`;
  }
  const days = Math.round(minutes / (24 * 60));
  return `${days}d free trial`;
}

export function getTrialLongLabel(): string {
  const minutes = getTrialMinutes();
  if (minutes < 60) return `${minutes}-minute free trial`;
  if (minutes < 24 * 60) {
    const hours = Math.round(minutes / 60);
    return `${hours}-hour free trial`;
  }
  const days = Math.round(minutes / (24 * 60));
  return `${days}-day free trial`;
}

export function getTrialBadgeLabel(): string {
  const minutes = getTrialMinutes();
  if (minutes < 60) return `${minutes} min trial`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h trial`;
  return `${Math.round(minutes / (24 * 60))}d trial`;
}

/** @deprecated Use getTrialSeconds() */
export const TRIAL_SECONDS = getTrialSeconds();
/** @deprecated Use getTrialHours() */
export const TRIAL_HOURS = getTrialHours();

export const TRIAL_HIGHLIGHT_KEY = '48h free trial';

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
    priceCents: 50,
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
  const trialHighlight = getTrialShortLabel();
  if (withTrial) {
    return plan.highlights.map((h) =>
      h === TRIAL_HIGHLIGHT_KEY ? trialHighlight : h
    );
  }
  return plan.highlights.map((h) =>
    h === TRIAL_HIGHLIGHT_KEY ? 'Billed immediately' : h
  );
}

export function formatPlanPriceAmount(plan: PlanDefinition): string {
  return (plan.priceCents / 100).toFixed(plan.priceCents % 100 === 0 ? 0 : 2);
}

export function formatPlanPrice(plan: PlanDefinition): string {
  return `$${formatPlanPriceAmount(plan)}/month`;
}

export function formatPlanPriceMo(plan: PlanDefinition): string {
  return `$${formatPlanPriceAmount(plan)}/mo`;
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
