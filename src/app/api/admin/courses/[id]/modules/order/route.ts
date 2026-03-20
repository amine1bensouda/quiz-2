import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * PATCH /api/admin/courses/[id]/modules/order
 * Met à jour l'ordre des modules du cours.
 * Body: { moduleIds: string[] } — liste des id de modules dans le nouvel ordre.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;
    const body = await request.json();
    const { moduleIds } = body;

    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'moduleIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const modulesInCourse = await prisma.module.findMany({
      where: { courseId },
      select: { id: true },
    });
    const validIds = new Set(modulesInCourse.map((m) => m.id));
    const invalid = moduleIds.filter((id: string) => !validIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'Some module IDs do not belong to this course', invalid },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      moduleIds.map((moduleId: string, index: number) =>
        prisma.module.update({
          where: { id: moduleId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Erreur reorder modules:', error);
    return NextResponse.json(
      { error: 'Failed to reorder modules', details: error.message },
      { status: 500 }
    );
  }
}
