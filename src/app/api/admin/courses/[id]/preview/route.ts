import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createCoursePreviewToken } from '@/lib/course-preview-token';
import { SITE_URL } from '@/lib/constants';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Public site origin for redirects.
 * Prefer NEXT_PUBLIC_SITE_URL — behind nginx/pm2, request.nextUrl.origin is often http://0.0.0.0:3000.
 */
function getPublicOrigin(request: NextRequest): string {
  const configured = SITE_URL?.trim().replace(/\/$/, '');
  if (configured && !/0\.0\.0\.0|127\.0\.0\.1|localhost/i.test(configured)) {
    return configured;
  }

  const forwardedHost =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.split(',')[0]?.trim();
  const forwardedProto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';

  if (forwardedHost && !/^0\.0\.0\.0(?::|$)/i.test(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return configured || 'https://crackthecurve.com';
}

/**
 * GET /api/admin/courses/[id]/preview
 * Admin-only: redirect to the public course page with a signed draft-preview token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const origin = getPublicOrigin(request);

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
