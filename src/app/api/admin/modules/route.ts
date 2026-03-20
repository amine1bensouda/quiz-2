import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/modules
 * Récupère tous les modules avec leurs cours
 */
export async function GET(request: NextRequest) {
  try {
    const modules = await prisma.module.findMany({
      include: {
        course: true,
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: [
        { course: { title: 'asc' } },
        { order: 'asc' },
      ],
    });

    return NextResponse.json(modules);
  } catch (error: any) {
    console.error('Erreur récupération modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/modules
 * Crée un nouveau module
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, courseId, description, order } = body;

    if (!title || !slug || !courseId) {
      return NextResponse.json(
        { error: 'Title, slug, and courseId are required' },
        { status: 400 }
      );
    }

    const moduleItem = await prisma.module.create({
      data: {
        title,
        slug,
        courseId,
        description: description || null,
        order: order || 0,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json(moduleItem, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création module:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A module with this slug already exists for this course' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create module', details: error.message },
      { status: 500 }
    );
  }
}
