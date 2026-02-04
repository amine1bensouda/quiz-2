import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/courses
 * Récupère tous les cours
 */
export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            _count: {
              select: {
                quizzes: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            modules: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error('Erreur récupération cours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses
 * Crée un nouveau cours
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, description, status } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || null,
        status: status || 'draft',
      },
      include: {
        modules: true,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création cours:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create course', details: error.message },
      { status: 500 }
    );
  }
}
