import { prisma } from './db';
import { isActiveStatus, type PlanId } from './plans';

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
    if (!sub) return null;
    if (!isActiveStatus(sub.status)) return null;

    const now = new Date();
    if (sub.status === 'trialing') {
      if (sub.trialEndsAt && sub.trialEndsAt.getTime() > now.getTime()) {
        return sub as ActiveSubscription;
      }
      // Essai expiré sans bascule webhook : ne pas accorder l'accès.
      return null;
    }
    if (sub.status === 'active' || sub.status === 'past_due') {
      if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > now.getTime()) {
        return sub as ActiveSubscription;
      }
      // Période terminée sans renouvellement : pas d'accès.
      return null;
    }
    return sub as ActiveSubscription;
  } catch (error) {
    console.error('Error loading active subscription:', error);
    return null;
  }
}

export async function canUserAccessCourse(
  userId: string | null | undefined,
  courseId: string | null | undefined,
): Promise<boolean> {
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
): Promise<boolean> {
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
): Promise<boolean> {
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
): Promise<boolean> {
  return canUserAccessCourse(userId, moduleCourseId);
}

/**
 * Retourne l'ensemble des quizIds accessibles pour l'utilisateur courant.
 * Utilisé pour gater les listes sans N+1.
 * Renvoie `null` si ALL_ACCESS (=> tous accessibles, pas besoin de filtrage).
 */
export async function getAccessibleQuizIds(
  userId: string | null | undefined,
): Promise<Set<string> | null> {
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
