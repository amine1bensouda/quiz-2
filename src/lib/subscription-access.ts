import { prisma } from './db';
import { isActiveStatus, type PlanId } from './plans';
import { getStripe } from './stripe';

/**
 * Helpers centralisant la logique d'accès basée sur l'abonnement.
 *
 * Règles :
 *  - `ALL_ACCESS` : l'utilisateur a accès à tout (tous cours + quizzes autonomes).
 *  - `SINGLE_COURSE` : accès limité à `sub.courseId`. Les quizzes/leçons
 *    autonomes (sans cours parent) ne sont PAS accessibles avec ce plan.
 *  - Les statuts actifs sont définis dans `isActiveStatus` (trialing, active,
 *    past_due). `canceled`/`expired`/`incomplete` bloquent l'accès.
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

function hasValidAccessWindow(
  status: string,
  trialEndsAt: Date | null,
  currentPeriodEnd: Date | null
): boolean {
  const now = new Date();
  if (status === 'trialing') {
    return !!trialEndsAt && trialEndsAt.getTime() > now.getTime();
  }
  if (status === 'active' || status === 'past_due') {
    return !!currentPeriodEnd && currentPeriodEnd.getTime() > now.getTime();
  }
  return false;
}

async function syncStripeSubscriptionForUser(
  userId: string
): Promise<ActiveSubscription | null> {
  const latestStripeSub = await prisma.subscription.findFirst({
    where: { userId, provider: 'stripe' },
    orderBy: { createdAt: 'desc' },
  });
  if (!latestStripeSub) return null;

  try {
    const stripe = getStripe();
    let stripeSub: any = null;
    let customerId: string | null = latestStripeSub.providerCustomerId ?? null;

    if (latestStripeSub.providerSubscriptionId) {
      stripeSub = await stripe.subscriptions.retrieve(
        latestStripeSub.providerSubscriptionId
      );
      if (!customerId) {
        customerId =
          typeof stripeSub.customer === 'string'
            ? stripeSub.customer
            : stripeSub.customer?.id ?? null;
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (!user?.email) return null;

      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      const customer = customers.data[0];
      if (!customer) return null;
      customerId = customer.id;

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10,
      });

      // Ne pas utiliser subscriptions.data[0] ni un simple match userId : on
      // pourrait lier un ancien abonnement Stripe à une nouvelle ligne incomplete.
      stripeSub =
        subscriptions.data.find(
          (s) => s.metadata?.subscriptionId === latestStripeSub.id
        ) ?? null;
    }

    if (!stripeSub) return null;

    const normalizedStatus = normalizeStripeStatus(stripeSub.status);
    const updated = await prisma.subscription.update({
      where: { id: latestStripeSub.id },
      data: {
        providerSubscriptionId: stripeSub.id,
        providerCustomerId: customerId,
        status: normalizedStatus,
        trialEndsAt: toDate((stripeSub as any).trial_end ?? null),
        currentPeriodStart: toDate((stripeSub as any).current_period_start ?? null),
        currentPeriodEnd: toDate((stripeSub as any).current_period_end ?? null),
        cancelAtPeriodEnd: !!(stripeSub as any).cancel_at_period_end,
        canceledAt: toDate((stripeSub as any).canceled_at ?? null),
      },
      select: {
        id: true,
        userId: true,
        plan: true,
        courseId: true,
        provider: true,
        providerSubscriptionId: true,
        status: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    if (isActiveStatus(updated.status) && hasValidAccessWindow(updated.status, updated.trialEndsAt, updated.currentPeriodEnd)) {
      return updated as ActiveSubscription;
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
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['trialing', 'active', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        plan: true,
        courseId: true,
        provider: true,
        providerSubscriptionId: true,
        status: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });
    if (!sub) {
      const synced = await syncStripeSubscriptionForUser(userId);
      return synced;
    }
    if (!isActiveStatus(sub.status)) {
      const synced = await syncStripeSubscriptionForUser(userId);
      return synced;
    }

    if (hasValidAccessWindow(sub.status, sub.trialEndsAt, sub.currentPeriodEnd)) {
      return sub as ActiveSubscription;
    }

    // Fallback: tenter une resynchronisation live Stripe quand la DB est en retard.
    const synced = await syncStripeSubscriptionForUser(userId);
    if (synced) return synced;
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
