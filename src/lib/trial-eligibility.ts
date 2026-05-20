import { prisma } from '@/lib/db';

/**
 * True if this user has already used their one-time 48h trial.
 * Based only on `subscriptions` rows (no extra column on `users`):
 *  - any row with `trialEndsAt` set, or
 *  - any row that went through the provider (providerSubscriptionId) with a
 *    non-incomplete status (trial started, paid, or ended).
 */
export async function hasUserConsumedFreeTrial(userId: string): Promise<boolean> {
  const prior = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { trialEndsAt: { not: null } },
        {
          providerSubscriptionId: { not: null },
          status: {
            in: ['trialing', 'active', 'past_due', 'canceled', 'expired'],
          },
        },
      ],
    },
    select: { id: true },
  });

  return !!prior;
}

/** Whether this account can still start a checkout with a 48h trial. */
export async function canUserStartFreeTrial(userId: string): Promise<boolean> {
  return !(await hasUserConsumedFreeTrial(userId));
}
