import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/[id] — Récupère une lesson par slug (ou id legacy)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;
    const lessonById = await prisma.lesson.findUnique({
      where: { id: idOrSlug },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });
    const lesson =
      lessonById ??
      (await prisma.lesson.findFirst({
        where: { slug: idOrSlug },
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      }));

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (lesson.module && lesson.module.course.status !== 'published') {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('GET /api/lessons/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}
