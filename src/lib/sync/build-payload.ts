import { prisma } from '@/lib/db';
import {
  SYNC_PAYLOAD_VERSION,
  type SyncQuizPayload,
} from './types';
import { buildPayloadHash } from './hash';

const quizInclude = {
  module: {
    include: {
      course: true,
    },
  },
  questions: {
    include: {
      answers: true,
    },
    orderBy: { order: 'asc' as const },
  },
} as const;

export async function buildQuizSyncPayload(
  quizId: string
): Promise<SyncQuizPayload | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: quizInclude,
  });

  if (!quiz) return null;

  const modulePayload = quiz.module
    ? {
        sourceModuleId: quiz.module.id,
        title: quiz.module.title,
        slug: quiz.module.slug,
        description: quiz.module.description,
        order: quiz.module.order,
        course: quiz.module.course
          ? {
              sourceCourseId: quiz.module.course.id,
              title: quiz.module.course.title,
              slug: quiz.module.course.slug,
              description: quiz.module.course.description,
              status: quiz.module.course.status,
            }
          : null,
      }
    : null;

  const questions = quiz.questions.map((q) => ({
    sourceQuestionId: q.id,
    text: q.text,
    type: q.type,
    points: q.points,
    explanation: q.explanation,
    timeLimit: q.timeLimit,
    order: q.order,
    answers: q.answers
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((a) => ({
        sourceAnswerId: a.id,
        text: a.text,
        isCorrect: a.isCorrect,
        explanation: a.explanation,
        imageUrl: a.imageUrl,
        order: a.order,
      })),
  }));

  const core = {
    sourceQuizId: quiz.id,
    sourceUpdatedAt: quiz.updatedAt.toISOString(),
    quiz: {
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      excerpt: quiz.excerpt,
      duration: quiz.duration,
      difficulty: quiz.difficulty || null,
      passingGrade: quiz.passingGrade,
      randomizeOrder: quiz.randomizeOrder,
      maxQuestions: quiz.maxQuestions,
      featuredImageUrl: quiz.featuredImageUrl,
      order: quiz.order,
      module: modulePayload,
    },
    questions,
  };

  const payloadHash = buildPayloadHash(core);

  return {
    version: SYNC_PAYLOAD_VERSION,
    payloadHash,
    ...core,
  };
}
