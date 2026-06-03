import { NextRequest, NextResponse } from 'next/server';
import { isFullRequest } from '@/lib/request-utils';
import { invalidatePublishedCoursesCache } from '@/lib/cache';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/courses/[id]
 * Update a course
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle sync and async params (Next.js 14+)
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
      // Validate status
      if (status !== 'published' && status !== 'draft') {
        return NextResponse.json(
          { error: 'Invalid status. Must be "published" or "draft"' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Ensure at least one field to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Ensure course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const full = isFullRequest(request);
    const course = full
      ? await prisma.course.update({
          where: { id: courseId },
          data: updateData,
          include: {
            modules: true,
          },
        })
      : await prisma.course.update({
          where: { id: courseId },
          data: updateData,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            updatedAt: true,
          },
        });

    invalidatePublishedCoursesCache();

    console.log(`✅ Course ${courseId} updated via PUT:`, updateData);

    return NextResponse.json(course);
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    console.error(`Error updating course ${resolvedParams.id}:`, error);
    
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
 * Partially update a course (especially status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle sync and async params (Next.js 14+)
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;

    const body = await request.json();
    const { status, title, slug, description } = body;

    // Validate status if provided
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

    // Ensure at least one field to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Ensure course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const full = isFullRequest(request);
    const course = full
      ? await prisma.course.update({
          where: { id: courseId },
          data: updateData,
          include: {
            modules: true,
          },
        })
      : await prisma.course.update({
          where: { id: courseId },
          data: updateData,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            updatedAt: true,
          },
        });

    console.log(`✅ Course ${courseId} updated: status=${course.status}`);

    return NextResponse.json(course);
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    console.error(`❌ Error updating course ${resolvedParams.id}:`, error);
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
 * Delete a course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle sync and async params (Next.js 14+)
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;

    await prisma.course.delete({
      where: { id: courseId },
    });

    invalidatePublishedCoursesCache();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    console.error(`Error deleting course ${resolvedParams.id}:`, error);
    
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
