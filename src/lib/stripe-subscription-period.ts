/**
 * Stripe Basil (2025-03-31+) moved billing period fields from Subscription
 * to SubscriptionItem. Read both locations for compatibility.
 */

type StripeSubLike = {
  current_period_start?: number | null;
  current_period_end?: number | null;
  items?: {
    data?: Array<{
      current_period_start?: number | null;
      current_period_end?: number | null;
    }>;
  } | null;
};

function collectItemPeriodValues(
  stripeSub: StripeSubLike,
  field: 'current_period_start' | 'current_period_end'
): number[] {
  const items = stripeSub.items?.data ?? [];
  const values: number[] = [];
  for (const item of items) {
    const value = item[field];
    if (typeof value === 'number' && value > 0) {
      values.push(value);
    }
  }
  return values;
}

export function getStripeSubscriptionPeriodStart(
  stripeSub: StripeSubLike
): number | null {
  const root = stripeSub.current_period_start;
  if (typeof root === 'number' && root > 0) return root;

  const itemStarts = collectItemPeriodValues(stripeSub, 'current_period_start');
  if (itemStarts.length === 0) return null;
  return Math.min(...itemStarts);
}

export function getStripeSubscriptionPeriodEnd(
  stripeSub: StripeSubLike
): number | null {
  const root = stripeSub.current_period_end;
  if (typeof root === 'number' && root > 0) return root;

  const itemEnds = collectItemPeriodValues(stripeSub, 'current_period_end');
  if (itemEnds.length === 0) return null;
  // Earliest end among items — conservative for access windows.
  return Math.min(...itemEnds);
}
