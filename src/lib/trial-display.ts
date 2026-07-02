export interface TrialDisplaySubscription {
  trialEndsAt: string | Date | null;
  cancelAtPeriodEnd?: boolean;
  status?: string;
}

export function isActiveTrialSubscription(
  subscription: TrialDisplaySubscription | null | undefined
): boolean {
  if (!subscription?.trialEndsAt) return false;
  return new Date(subscription.trialEndsAt).getTime() > Date.now();
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
