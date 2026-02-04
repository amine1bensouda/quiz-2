import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    const moduleItem = await prisma.module.update({
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
    });

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
