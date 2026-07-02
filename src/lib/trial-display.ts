import { TRIAL_SECONDS } from './plans';

/** Fenêtre max pour considérer une date comme fin d'essai 48h (pas fin de mois). */
const TRIAL_WINDOW_MAX_MS = TRIAL_SECONDS * 1000 + 6 * 60 * 60 * 1000;

export interface TrialDisplaySubscription {
  trialEndsAt: string | Date | null;
  currentPeriodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean;
  status?: string;
}

/** True si la date est dans le futur et dans la fenêtre d'un essai 48h. */
export function isPlausibleTrialEndDate(
  date: Date | string,
  nowMs: number = Date.now()
): boolean {
  const remaining = new Date(date).getTime() - nowMs;
  return remaining > 0 && remaining <= TRIAL_WINDOW_MAX_MS;
}

/** Date de fin d'essai affichée — jamais la fin de période mensuelle (~30 j). */
export function getTrialAccessEndDate(
  subscription: TrialDisplaySubscription | null | undefined
): Date | null {
  if (!subscription) return null;
  const now = Date.now();
  const candidates: number[] = [];

  const pushIfTrialWindow = (date: Date | string) => {
    if (isPlausibleTrialEndDate(date, now)) {
      candidates.push(new Date(date).getTime());
    }
  };

  if (subscription.trialEndsAt) {
    pushIfTrialWindow(subscription.trialEndsAt);
  }

  const inTrialLikeStatus =
    subscription.status === 'trialing' ||
    subscription.cancelAtPeriodEnd ||
    subscription.status === 'canceled';

  if (inTrialLikeStatus && subscription.currentPeriodEnd) {
    pushIfTrialWindow(subscription.currentPeriodEnd);
  }

  if (candidates.length === 0) return null;
  return new Date(Math.min(...candidates));
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
