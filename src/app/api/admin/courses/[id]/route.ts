import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * PUT /api/admin/courses/[id]
 * Met à jour un cours
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Gérer les params synchrones et asynchrones (Next.js 14+)
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;

    const body = await request.json();
    const { title, slug, description, status } = body;

    const updateData: any = {};
    if (title !== undefined && title !== null) {
      updateData.title = title;
    }
    if (slug !== undefined && slug !== null) {
      updateData.slug = slug;
    }
    if (description !== undefined) {
      updateData.description = description || null;
    }
    if (status !== undefined && status !== null) {
      // Valider le statut
      if (status !== 'published' && status !== 'draft') {
        return NextResponse.json(
          { error: 'Invalid status. Must be "published" or "draft"' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        modules: true,
      },
    });

    console.log(`✅ Cours ${courseId} mis à jour via PUT:`, updateData);

    return NextResponse.json(course);
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    console.error(`Erreur mise à jour cours ${resolvedParams.id}:`, error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update course', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/courses/[id]
 * Met à jour partiellement un cours (notamment le statut)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Gérer les params synchrones et asynchrones (Next.js 14+)
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;

    const body = await request.json();
    const { status, title, slug, description } = body;

    // Valider le statut si fourni
    if (status && status !== 'published' && status !== 'draft') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "published" or "draft"' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined && status !== null) {
      updateData.status = status;
    }
    if (title !== undefined && title !== null) {
      updateData.title = title;
    }
    if (slug !== undefined && slug !== null) {
      updateData.slug = slug;
    }
    if (description !== undefined) {
      updateData.description = description || null;
    }

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        modules: true,
      },
    });

    console.log(`✅ Cours ${courseId} mis à jour: status=${course.status}`);

    return NextResponse.json(course);
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    console.error(`❌ Erreur mise à jour cours ${resolvedParams.id}:`, error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update course', 
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[id]
 * Supprime un cours
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Gérer les params synchrones et asynchrones (Next.js 14+)
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    console.error(`Erreur suppression cours ${resolvedParams.id}:`, error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete course', details: error.message },
      { status: 500 }
    );
  }
}
