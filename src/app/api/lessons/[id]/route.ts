import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withCacheHeaders, withNoStoreHeaders } from '@/lib/http-cache';
import { addResponseObservability } from '@/lib/traffic-guard';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { canUserAccessLesson } from '@/lib/subscription-access';


export const dynamic = 'force-dynamic';

/**
 * GET /api/lessons/[id] — Récupère une lesson par slug (ou id legacy).
 * Si l'utilisateur n'a pas d'abonnement couvrant le cours parent (et que
 * `allowPreview` est faux), les champs sensibles (content, videoUrl,
 * pdfUrl) sont masqués et un flag `isLocked` est ajouté.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
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
      return addResponseObservability(
        NextResponse.json({ error: 'Lesson not found' }, { status: 404 }),
        startTime,
        '/api/lessons/[id]'
      );
    }

    if (lesson.module && lesson.module.course.status !== 'published') {
      return addResponseObservability(
        NextResponse.json({ error: 'Lesson not found' }, { status: 404 }),
        startTime,
        '/api/lessons/[id]'
      );
    }

    const user = await getCurrentUserFromSession();
    const canAccess = await canUserAccessLesson(user?.id ?? null, {
      id: lesson.id,
      moduleId: lesson.moduleId,
      allowPreview: lesson.allowPreview,
      module: lesson.module ? { courseId: lesson.module.courseId } : null,
    });

    if (!canAccess) {
      const stripped = {
        ...lesson,
        content: '',
        videoUrl: null,
        pdfUrl: null,
        videoPlaybackSeconds: null,
        isLocked: true,
      };
      return addResponseObservability(
        withNoStoreHeaders(NextResponse.json(stripped)),
        startTime,
        '/api/lessons/[id]'
      );
    }

    return addResponseObservability(withCacheHeaders(NextResponse.json({ ...lesson, isLocked: false }), {
      sMaxAge: 300,
      staleWhileRevalidate: 3600,
      maxAge: 60,
    }), startTime, '/api/lessons/[id]');
  } catch (error) {
    console.error('GET /api/lessons/[id]:', error);
    return addResponseObservability(NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    ), startTime, '/api/lessons/[id]');
  }
}
