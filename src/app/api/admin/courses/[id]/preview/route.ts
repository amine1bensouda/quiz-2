import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createCoursePreviewToken } from '@/lib/course-preview-token';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/courses/[id]/preview
 * Admin-only: redirect to the public course page with a signed draft-preview token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const origin = request.nextUrl.origin;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL('/admin/login', origin));
  }

  const { id } = await Promise.resolve(params);
  const course = await prisma.course.findUnique({
    where: { id },
    select: { slug: true, status: true },
  });

  if (!course?.slug) {
    return NextResponse.redirect(new URL('/admin/courses', origin));
  }

  const coursePath = `/quiz/course/${encodeURIComponent(course.slug)}`;

  if (course.status === 'published') {
    return NextResponse.redirect(new URL(coursePath, origin));
  }

  const token = await createCoursePreviewToken(course.slug);
  const url = new URL(coursePath, origin);
  url.searchParams.set('preview', token);
  return NextResponse.redirect(url);
}
