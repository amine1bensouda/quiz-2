import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-server';

/**
 * GET /api/quiz-attempts
 * Récupère tous les quiz attempts de l'utilisateur connecté
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return NextResponse.json({ attempts });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error getting quiz attempts:', error);
    return NextResponse.json(
      { error: 'Failed to get quiz attempts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quiz-attempts
 * Crée un nouveau quiz attempt
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { quizId, score, percentage, totalQuestions, correctAnswers, timeSpent } = body;

    // Validation
    if (!quizId || score === undefined || percentage === undefined || 
        totalQuestions === undefined || correctAnswers === undefined || timeSpent === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Vérifier que le quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Créer le quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId,
        score,
        percentage,
        totalQuestions,
        correctAnswers,
        timeSpent,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      { attempt },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error creating quiz attempt:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz attempt' },
      { status: 500 }
    );
  }
}
