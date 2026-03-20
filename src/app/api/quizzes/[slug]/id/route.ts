import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/quizzes/[slug]/id
 * Récupère uniquement l'ID Prisma d'un quiz par son slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: quiz.id });
  } catch (error) {
    const { slug } = await params;
    console.error(`Erreur API quiz ID ${slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz ID' },
      { status: 500 }
    );
  }
}
