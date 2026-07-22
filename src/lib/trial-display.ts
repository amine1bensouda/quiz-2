import { getTrialSeconds, getTrialWindowMaxMs } from './plans';

/** Fenêtre max pour considérer une date comme fin d'essai (pas fin de mois). */
function trialWindowMaxMs(): number {
  return getTrialWindowMaxMs();
}

export interface TrialDisplaySubscription {
  trialEndsAt: string | Date | null;
  currentPeriodStart?: string | Date | null;
  currentPeriodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean;
  status?: string;
  createdAt?: string | Date | null;
}

function toTimestampMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** True si la date est dans le futur et dans la fenêtre d'un essai 48h. */
export function isPlausibleTrialEndDate(
  date: Date | string,
  nowMs: number = Date.now()
): boolean {
  const remaining = new Date(date).getTime() - nowMs;
  return remaining > 0 && remaining <= trialWindowMaxMs();
}

function pushFutureTimestamp(
  candidates: number[],
  value: Date | string | null | undefined,
  nowMs: number
): void {
  const ms = toTimestampMs(value);
  if (ms !== null && ms > nowMs) candidates.push(ms);
}

function pushSyntheticTrialEnd(
  candidates: number[],
  start: Date | string | null | undefined,
  nowMs: number
): void {
  const startMs = toTimestampMs(start);
  if (startMs === null) return;
  const endMs = startMs + getTrialSeconds() * 1000;
  if (endMs > nowMs) candidates.push(endMs);
}

/**
 * Fin d'accès au contenu. L'essai 48h reste valide après annulation
 * (trialEndsAt, cancel_at, début de période + 48h, ou createdAt + 48h).
 */
export function resolveSubscriptionAccessEnd(
  subscription: TrialDisplaySubscription | null | undefined
): Date | null {
  if (!subscription) return null;
  const now = Date.now();
  const candidates: number[] = [];
  const status = subscription.status ?? '';
  const cancelAtPeriodEnd = !!subscription.cancelAtPeriodEnd;
  const inTrialContext =
    status === 'trialing' || status === 'canceled' || cancelAtPeriodEnd;

  pushFutureTimestamp(candidates, subscription.trialEndsAt, now);

  if (status === 'trialing') {
    pushFutureTimestamp(candidates, subscription.currentPeriodEnd, now);
  }

  if (inTrialContext && status !== 'active' && status !== 'past_due' && status !== 'expired') {
    pushSyntheticTrialEnd(candidates, subscription.currentPeriodStart, now);
    pushSyntheticTrialEnd(candidates, subscription.createdAt, now);
    const periodEndMs = toTimestampMs(subscription.currentPeriodEnd);
    if (
      periodEndMs !== null &&
      periodEndMs > now &&
      isPlausibleTrialEndDate(new Date(periodEndMs), now)
    ) {
      candidates.push(periodEndMs);
    }
  }

  // past_due / expired: no content access (single payment attempt policy)

  if (status === 'active' && candidates.length === 0) {
    pushFutureTimestamp(candidates, subscription.currentPeriodEnd, now);
  }

  if (candidates.length === 0) return null;
  return new Date(Math.min(...candidates));
}

export function subscriptionHasContentAccess(
  subscription: TrialDisplaySubscription | null | undefined
): boolean {
  return resolveSubscriptionAccessEnd(subscription) !== null;
}

/** Date affichée dans le compteur (masque une fin de mois Stripe erronée). */
export function getTrialAccessEndDate(
  subscription: TrialDisplaySubscription | null | undefined
): Date | null {
  const accessEnd = resolveSubscriptionAccessEnd(subscription);
  if (!accessEnd) return null;

  if (isPlausibleTrialEndDate(accessEnd)) return accessEnd;

  const now = Date.now();
  const displayCandidates: number[] = [];
  pushSyntheticTrialEnd(displayCandidates, subscription?.currentPeriodStart, now);
  pushSyntheticTrialEnd(displayCandidates, subscription?.createdAt, now);
  const periodEndMs = toTimestampMs(subscription?.currentPeriodEnd);
  if (
    periodEndMs !== null &&
    periodEndMs > now &&
    isPlausibleTrialEndDate(new Date(periodEndMs), now)
  ) {
    displayCandidates.push(periodEndMs);
  }

  if (displayCandidates.length === 0) return null;
  return new Date(Math.min(...displayCandidates));
}

export function isActiveTrialSubscription(
  subscription: TrialDisplaySubscription | null | undefined
): boolean {
  return getTrialAccessEndDate(subscription) !== null;
}

export function isTrialCanceled(
  subscription: TrialDisplaySubscription | null | undefined
): boolean {
  if (!subscription) return false;
  return !!(subscription.cancelAtPeriodEnd || subscription.status === 'canceled');
}

export function formatTrialEndDate(trialEndsAt: string | Date): string {
  return new Date(trialEndsAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTrialRemainingMs(trialEndsAt: string | Date): number {
  return Math.max(0, new Date(trialEndsAt).getTime() - Date.now());
}

export function splitTrialRemaining(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const totalSec = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}
