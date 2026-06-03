import { prisma } from '@/lib/db';
import { getMissingSyncEnvVars } from './env-check';
import { publishQuizToFreeSite } from './publish-quiz';

export type PublishCourseToFreeResult = {
  courseId: string;
  courseTitle: string;
  totalQuizzes: number;
  published: number;
  alreadyUpToDate: number;
  failed: number;
  failures: Array<{ quizId: string; quizTitle: string; error: string }>;
};

export async function publishCourseToFreeSite(
  courseId: string
): Promise<PublishCourseToFreeResult> {
  const missingEnv = getMissingSyncEnvVars();
  if (missingEnv.length > 0) {
    throw new Error(`Missing sync configuration: ${missingEnv.join(', ')}`);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      modules: {
        select: {
          quizzes: {
            select: { id: true, title: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  const quizzes = course.modules.flatMap((m) => m.quizzes);
  if (quizzes.length === 0) {
    throw new Error('No quizzes found in this course');
  }

  let published = 0;
  let alreadyUpToDate = 0;
  let failed = 0;
  const failures: Array<{ quizId: string; quizTitle: string; error: string }> = [];

  for (const quiz of quizzes) {
    try {
      const result = await publishQuizToFreeSite(quiz.id);
      if (result.alreadyUpToDate) {
        alreadyUpToDate += 1;
      } else {
        published += 1;
      }
    } catch (error) {
      failed += 1;
      failures.push({
        quizId: quiz.id,
        quizTitle: quiz.title,
        error: error instanceof Error ? error.message : 'Publishing error',
      });
    }
  }

  return {
    courseId: course.id,
    courseTitle: course.title,
    totalQuizzes: quizzes.length,
    published,
    alreadyUpToDate,
    failed,
    failures,
  };
}
