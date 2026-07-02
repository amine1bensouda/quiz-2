export interface TrialDisplaySubscription {
  trialEndsAt: string | Date | null;
  currentPeriodEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean;
  status?: string;
}

/** Date de fin d'accès affichée (trial_end ou current_period_end en essai). */
export function getTrialAccessEndDate(
  subscription: TrialDisplaySubscription | null | undefined
): Date | null {
  if (!subscription) return null;
  const now = Date.now();

  if (subscription.trialEndsAt) {
    const trialEnd = new Date(subscription.trialEndsAt);
    if (trialEnd.getTime() > now) return trialEnd;
  }

  const inTrialLikeStatus =
    subscription.status === 'trialing' ||
    subscription.cancelAtPeriodEnd ||
    subscription.status === 'canceled';

  if (inTrialLikeStatus && subscription.currentPeriodEnd) {
    const periodEnd = new Date(subscription.currentPeriodEnd);
    if (periodEnd.getTime() > now) return periodEnd;
  }

  return null;
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
