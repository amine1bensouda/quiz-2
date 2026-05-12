import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublishedCoursesCache, invalidatePublishedQuizzesCache } from '@/lib/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/modules/[id]/quizzes/order
 * Body: { quizIds: string[] } — IDs des quiz du module, dans le nouvel ordre d’affichage.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: moduleId } = await Promise.resolve(params);
    const body = await request.json();
    const { quizIds } = body;

    if (!Array.isArray(quizIds) || quizIds.length === 0) {
      return NextResponse.json({ error: 'quizIds must be a non-empty array' }, { status: 400 });
    }

    const moduleItem = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true },
    });
    if (!moduleItem) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const quizzesInModule = await prisma.quiz.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const validIds = new Set(quizzesInModule.map((q) => q.id));
    if (quizzesInModule.length !== quizIds.length) {
      return NextResponse.json(
        { error: 'quizIds must include every quiz in this module exactly once' },
        { status: 400 }
      );
    }
    const invalid = quizIds.filter((id: string) => typeof id !== 'string' || !validIds.has(id));
    if (invalid.length > 0 || new Set(quizIds).size !== quizIds.length) {
      return NextResponse.json(
        { error: 'Invalid or duplicate quiz IDs for this module' },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      quizIds.map((quizId: string, index: number) =>
        prisma.quiz.update({
          where: { id: quizId },
          data: { order: index },
        })
      )
    );

    invalidatePublishedCoursesCache();
    invalidatePublishedQuizzesCache();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Erreur reorder quizzes module:', error);
    return NextResponse.json(
      { error: 'Failed to reorder quizzes', details: message },
      { status: 500 }
    );
  }
}
