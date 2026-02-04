import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { convertPrismaQuizToQuiz } from '@/lib/quiz-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const moduleId = resolvedParams.id;

    const quizzes = await prisma.quiz.findMany({
      where: {
        moduleId: moduleId,
      },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const converted = quizzes.map(convertPrismaQuizToQuiz);

    return NextResponse.json(converted);
  } catch (error: any) {
    console.error(`Erreur récupération quiz module ${params}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch module quizzes', details: error.message },
      { status: 500 }
    );
  }
}
