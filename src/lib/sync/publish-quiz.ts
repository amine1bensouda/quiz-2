import { prisma } from '@/lib/db';
import { invalidatePublishedQuizzesCache } from '@/lib/cache';
import { buildQuizSyncPayload } from './build-payload';
import { pushQuizPayloadToFreeSite } from './push-to-free';

export type PublishQuizResult = {
  ok: true;
  freeQuizId: string;
  freeSlug: string;
  syncPublishStatus: string;
  alreadyUpToDate?: boolean;
};

export async function publishQuizToFreeSite(
  quizId: string
): Promise<PublishQuizResult> {
  const payload = await buildQuizSyncPayload(quizId);
  if (!payload) {
    throw new Error('Quiz not found');
  }

  const existing = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      lastSyncPayloadHash: true,
      syncPublishStatus: true,
      freeQuizId: true,
    },
  });

  if (
    existing?.lastSyncPayloadHash === payload.payloadHash &&
    existing.syncPublishStatus === 'PUBLISHED' &&
    existing.freeQuizId
  ) {
    return {
      ok: true,
      freeQuizId: existing.freeQuizId,
      freeSlug: payload.quiz.slug,
      syncPublishStatus: 'PUBLISHED',
      alreadyUpToDate: true,
    };
  }

  const log = await prisma.syncLog.create({
    data: {
      quizId,
      status: 'pending',
      payloadHash: payload.payloadHash,
    },
  });

  try {
    const result = await pushQuizPayloadToFreeSite(payload);

    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        syncPublishStatus: 'PUBLISHED',
        lastSyncedAt: new Date(),
        freeQuizId: result.localQuizId,
        lastSyncPayloadHash: payload.payloadHash,
      },
    });

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: 'success',
        freeQuizId: result.localQuizId,
      },
    });

    invalidatePublishedQuizzesCache();

    return {
      ok: true,
      freeQuizId: result.localQuizId,
      freeSlug: result.localSlug,
      syncPublishStatus: 'PUBLISHED',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';

    await prisma.quiz.update({
      where: { id: quizId },
      data: { syncPublishStatus: 'FAILED' },
    });

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorMessage: message,
      },
    });

    throw err;
  }
}

/** Marque un quiz publié comme obsolète après édition premium. */
export async function markQuizSyncOutOfDateIfPublished(
  quizId: string
): Promise<void> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { syncPublishStatus: true, freeQuizId: true },
  });
  if (!quiz?.freeQuizId) return;
  if (quiz.syncPublishStatus === 'NOT_PUBLISHED') return;

  await prisma.quiz.update({
    where: { id: quizId },
    data: { syncPublishStatus: 'OUT_OF_DATE' },
  });
}
