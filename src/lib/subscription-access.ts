import { prisma } from './db';
import { type PlanId } from './plans';
import { getStripe } from './stripe';
import {
  getStripeSubscriptionPeriodEnd,
  getStripeSubscriptionPeriodStart,
} from './stripe-subscription-period';

/**
 * Helpers centralisant la logique d'accès basée sur l'abonnement.
 *
 * Règles :
 *  - `ALL_ACCESS` : l'utilisateur a accès à tout (tous cours + quizzes autonomes).
 *  - `SINGLE_COURSE` : accès limité à `sub.courseId`. Les quizzes/leçons
 *    autonomes (sans cours parent) ne sont PAS accessibles avec ce plan.
 *  - Les statuts actifs sont définis dans `isActiveStatus` (trialing, active,
 *    past_due). `canceled`/`expired`/`incomplete` bloquent l'accès.
 *  - Essai (`trialing`) : accès jusqu'à `trialEndsAt`, même si l'utilisateur a
 *    annulé avant la fin des 48 h (`cancel_at_period_end`).
 *  - Période payante (`active` / `past_due`) + annulation : accès coupé dès
 *    l'annulation (comportement actuel pour la facturation mensuelle).
 */

export interface ActiveSubscription {
  id: string;
  userId: string;
  plan: PlanId;
  courseId: string | null;
  provider: string;
  providerSubscriptionId: string | null;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

function toDate(ts: number | null | undefined): Date | null {
  if (!ts || Number.isNaN(ts)) return null;
  return new Date(ts * 1000);
}

function normalizeStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'trialing':
    case 'active':
    case 'past_due':
    case 'canceled':
      return stripeStatus;
    case 'incomplete':
      return 'incomplete';
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
      return 'expired';
    default:
      return String(stripeStatus);
  }
}

/**
 * Déduit si l'utilisateur a demandé l'arrêt du renouvellement côté Stripe.
 * On combine `cancel_at_period_end` et, en secours, `cancel_at` dans le futur
 * (certains retours portail / versions d'API ne se comportent pas pareil).
 */
export function stripeSubscriptionHasScheduledCancellation(stripeSub: {
  cancel_at_period_end?: boolean | null;
  cancel_at?: number | null;
}): boolean {
  if (stripeSub.cancel_at_period_end === true) return true;
  const cat = stripeSub.cancel_at;
  if (typeof cat === 'number' && cat > 0 && cat > Math.floor(Date.now() / 1000)) {
    return true;
  }
  return false;
}

function hasValidAccessWindow(
  status: string,
  trialEndsAt: Date | null,
  currentPeriodEnd: Date | null,
  cancelAtPeriodEnd: boolean,
): boolean {
  const now = new Date();
  if (status === 'trialing') {
    return !!(trialEndsAt && trialEndsAt.getTime() > now.getTime());
  }
  // Stripe peut passer en `canceled` avant trial_end après annulation portail.
  if (status === 'canceled' && trialEndsAt && trialEndsAt.getTime() > now.getTime()) {
    return true;
  }
  if (status === 'active' || status === 'past_due') {
    if (!currentPeriodEnd || currentPeriodEnd.getTime() <= now.getTime()) return false;
    if (cancelAtPeriodEnd) return false;
    return true;
  }
  return false;
}

function subscriptionSelectFields() {
  return {
    id: true,
    userId: true,
    plan: true,
    courseId: true,
    provider: true,
    providerSubscriptionId: true,
    providerCustomerId: true,
    status: true,
    trialEndsAt: true,
    currentPeriodEnd: true,
    cancelAtPeriodEnd: true,
  } as const;
}

type SubscriptionRow = {
  id: string;
  userId: string;
  plan: string;
  courseId: string | null;
  provider: string;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

function toActiveSubscription(row: SubscriptionRow): ActiveSubscription {
  return {
    id: row.id,
    userId: row.userId,
    plan: row.plan as PlanId,
    courseId: row.courseId,
    provider: row.provider,
    providerSubscriptionId: row.providerSubscriptionId,
    status: row.status,
    trialEndsAt: row.trialEndsAt,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}

async function resolveStripeSubscriptionForLocalRow(
  localSub: Pick<
    SubscriptionRow,
    'id' | 'userId' | 'providerSubscriptionId' | 'providerCustomerId'
  >,
  userEmail: string
): Promise<{ stripeSub: any; customerId: string | null } | null> {
  const stripe = getStripe();

  const findByMetadata = async (customerId: string) => {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
    });
    const byLocalId = subscriptions.data.find(
      (s) => s.metadata?.subscriptionId === localSub.id
    );
    if (byLocalId) return byLocalId;

    const activeish = subscriptions.data
      .filter(
        (s) =>
          s.status !== 'canceled' &&
          s.status !== 'incomplete_expired' &&
          s.metadata?.userId === localSub.userId
      )
      .sort((a, b) => b.created - a.created);
    return activeish[0] ?? null;
  };

  let customerId = localSub.providerCustomerId;

  if (localSub.providerSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(
        localSub.providerSubscriptionId
      );
      customerId =
        customerId ??
        (typeof stripeSub.customer === 'string'
          ? stripeSub.customer
          : stripeSub.customer?.id ?? null);

      if (
        stripeSub.status === 'canceled' ||
        stripeSub.status === 'incomplete_expired'
      ) {
        if (customerId) {
          const byMeta = await findByMetadata(customerId);
          if (byMeta) {
            return {
              stripeSub: byMeta,
              customerId:
                customerId ??
                (typeof byMeta.customer === 'string'
                  ? byMeta.customer
                  : byMeta.customer?.id ?? null),
            };
          }
        }
      }

      return { stripeSub, customerId };
    } catch {
      // Subscription removed on Stripe — fall through to metadata lookup.
    }
  }

  const customers = await stripe.customers.list({
    email: userEmail,
    limit: 1,
  });
  const customer = customers.data[0];
  if (!customer) return null;

  customerId = customer.id;
  const stripeSub = await findByMetadata(customer.id);
  if (!stripeSub) return null;

  return { stripeSub, customerId };
}

async function syncSubscriptionRowFromStripe(
  localSub: SubscriptionRow,
  userEmail: string
): Promise<ActiveSubscription | null> {
  const resolved = await resolveStripeSubscriptionForLocalRow(localSub, userEmail);
  if (!resolved) return null;

  const { stripeSub, customerId } = resolved;
  const normalizedStatus = normalizeStripeStatus(stripeSub.status);
  const updated = await prisma.subscription.update({
    where: { id: localSub.id },
    data: {
      providerSubscriptionId: stripeSub.id,
      providerCustomerId: customerId,
      status: normalizedStatus,
      trialEndsAt: toDate((stripeSub as any).trial_end ?? null),
      currentPeriodStart: toDate(getStripeSubscriptionPeriodStart(stripeSub as any)),
      currentPeriodEnd: toDate(getStripeSubscriptionPeriodEnd(stripeSub as any)),
      cancelAtPeriodEnd: stripeSubscriptionHasScheduledCancellation(stripeSub as any),
      canceledAt: toDate((stripeSub as any).canceled_at ?? null),
    },
    select: subscriptionSelectFields(),
  });

  if (
    hasValidAccessWindow(
      updated.status,
      updated.trialEndsAt,
      updated.currentPeriodEnd,
      updated.cancelAtPeriodEnd,
    )
  ) {
    return toActiveSubscription(updated);
  }

  return null;
}

/**
 * Met à jour les lignes d'abonnement Stripe depuis l'API Stripe (la plus récente
 * en priorité). Utile quand le webhook est en retard ou après une réinscription.
 */
export async function syncStripeSubscriptionForUser(
  userId: string
): Promise<ActiveSubscription | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return null;

  const rows = await prisma.subscription.findMany({
    where: { userId, provider: 'stripe' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: subscriptionSelectFields(),
  });

  if (rows.length === 0) return null;

  try {
    for (const row of rows) {
      const synced = await syncSubscriptionRowFromStripe(row, user.email);
      if (synced) return synced;
    }
  } catch (error) {
    console.error('Stripe subscription sync failed:', error);
  }

  return null;
}

export async function getUserActiveSubscription(
  userId: string | null | undefined,
): Promise<ActiveSubscription | null> {
  if (!userId) return null;
  try {
    const hasStripeRow = await prisma.subscription.findFirst({
      where: { userId, provider: 'stripe' },
      select: { id: true },
    });
    if (hasStripeRow) {
      const synced = await syncStripeSubscriptionForUser(userId);
      if (synced) return synced;
    }

    const candidates = await prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ['trialing', 'active', 'past_due', 'incomplete', 'canceled'] },
      },
      orderBy: { createdAt: 'desc' },
      select: subscriptionSelectFields(),
    });

    for (const sub of candidates) {
      if (
        hasValidAccessWindow(
          sub.status,
          sub.trialEndsAt,
          sub.currentPeriodEnd,
          sub.cancelAtPeriodEnd,
        )
      ) {
        return toActiveSubscription(sub);
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading active subscription:', error);
    return null;
  }
}

export async function canUserAccessCourse(
  userId: string | null | undefined,
  courseId: string | null | undefined,
  hasAdminAccess: boolean = false,
): Promise<boolean> {
  if (hasAdminAccess) return true;
  if (!userId || !courseId) return false;
  const sub = await getUserActiveSubscription(userId);
  if (!sub) return false;
  if (sub.plan === 'ALL_ACCESS') return true;
  if (sub.plan === 'SINGLE_COURSE' && sub.courseId === courseId) return true;
  return false;
}

export interface QuizWithCourseResolvable {
  id: string;
  moduleId?: string | null;
  module?: { courseId: string | null } | null;
}

export async function canUserAccessQuiz(
  userId: string | null | undefined,
  quiz: QuizWithCourseResolvable | null | undefined,
  hasAdminAccess: boolean = false,
): Promise<boolean> {
  if (hasAdminAccess) return true;
  if (!quiz) return false;
  if (!userId) return false;

  const sub = await getUserActiveSubscription(userId);
  if (!sub) return false;
  if (sub.plan === 'ALL_ACCESS') return true;

  // SINGLE_COURSE : doit matcher sur le cours parent.
  const courseId = quiz.module?.courseId ?? null;
  if (!courseId) return false; // quiz autonome => ALL_ACCESS only
  return sub.plan === 'SINGLE_COURSE' && sub.courseId === courseId;
}

export interface LessonWithCourseResolvable {
  id: string;
  moduleId?: string | null;
  allowPreview?: boolean | null;
  module?: { courseId: string | null } | null;
}

export async function canUserAccessLesson(
  userId: string | null | undefined,
  lesson: LessonWithCourseResolvable | null | undefined,
  hasAdminAccess: boolean = false,
): Promise<boolean> {
  if (hasAdminAccess) return true;
  if (!lesson) return false;
  if (lesson.allowPreview) return true;
  if (!userId) return false;
  const sub = await getUserActiveSubscription(userId);
  if (!sub) return false;
  if (sub.plan === 'ALL_ACCESS') return true;
  const courseId = lesson.module?.courseId ?? null;
  if (!courseId) return false;
  return sub.plan === 'SINGLE_COURSE' && sub.courseId === courseId;
}

export async function canUserAccessModule(
  userId: string | null | undefined,
  moduleCourseId: string | null | undefined,
  hasAdminAccess: boolean = false,
): Promise<boolean> {
  return canUserAccessCourse(userId, moduleCourseId, hasAdminAccess);
}

/**
 * Retourne l'ensemble des quizIds accessibles pour l'utilisateur courant.
 * Utilisé pour gater les listes sans N+1.
 * Renvoie `null` si ALL_ACCESS (=> tous accessibles, pas besoin de filtrage).
 */
export async function getAccessibleQuizIds(
  userId: string | null | undefined,
  hasAdminAccess: boolean = false,
): Promise<Set<string> | null> {
  if (hasAdminAccess) return null;
  if (!userId) return new Set<string>();
  const sub = await getUserActiveSubscription(userId);
  if (!sub) return new Set<string>();
  if (sub.plan === 'ALL_ACCESS') return null;
  if (sub.plan === 'SINGLE_COURSE' && sub.courseId) {
    const quizzes = await prisma.quiz.findMany({
      where: { module: { courseId: sub.courseId } },
      select: { id: true },
    });
    return new Set(quizzes.map((q) => q.id));
  }
  return new Set<string>();
}

/**
 * Supprime les questions/réponses d'un quiz converti au format front.
 * Utile pour répondre à une requête publique quand l'utilisateur n'a
 * pas un abonnement couvrant ce quiz.
 */
export function stripQuizContentForPaywall<T extends { acf?: unknown }>(quiz: T): T {
  if (!quiz || typeof quiz !== 'object' || !('acf' in quiz) || !quiz.acf) return quiz;
  const acf = quiz.acf as Record<string, unknown>;
  return {
    ...quiz,
    acf: {
      ...acf,
      questions: [],
    },
  } as T;
}

/**
 * Résout le courseId parent d'un quiz à partir de son id/slug.
 * Utile dans les routes API qui n'ont pas déjà le module en mémoire.
 */
export async function resolveQuizCourseId(
  quizId: string,
): Promise<string | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { module: { select: { courseId: true } } },
  });
  return quiz?.module?.courseId ?? null;
}
