import { NextRequest, NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { invalidatePublishedCoursesCache, invalidatePublishedQuizzesCache } from '@/lib/cache';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/modules/[id]
 * Met à jour un module
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, slug, courseId, description, order } = body;
    const full = isFullRequest(request);

    const moduleItem = full
      ? await prisma.module.update({
          where: { id: params.id },
          data: {
            ...(title && { title }),
            ...(slug && { slug }),
            ...(courseId !== undefined && { courseId }),
            ...(description !== undefined && { description: description || null }),
            ...(order !== undefined && { order }),
          },
          include: {
            course: true,
          },
        })
      : await prisma.module.update({
          where: { id: params.id },
          data: {
            ...(title && { title }),
            ...(slug && { slug }),
            ...(courseId !== undefined && { courseId }),
            ...(description !== undefined && { description: description || null }),
            ...(order !== undefined && { order }),
          },
          select: {
            id: true,
            title: true,
            slug: true,
            courseId: true,
            order: true,
            updatedAt: true,
          },
        });

    invalidatePublishedCoursesCache();
    invalidatePublishedQuizzesCache();
    return NextResponse.json(moduleItem);
  } catch (error: any) {
    console.error(`Erreur mise à jour module ${params.id}:`, error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update module', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/modules/[id]
 * Supprime un module
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.module.delete({
      where: { id: params.id },
    });

    invalidatePublishedCoursesCache();
    invalidatePublishedQuizzesCache();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Erreur suppression module ${params.id}:`, error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete module', details: error.message },
      { status: 500 }
    );
  }
}
