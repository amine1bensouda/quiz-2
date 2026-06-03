import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { publishCourseToFreeSite } from '@/lib/sync/publish-course';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/courses/[id]/publish-to-free
 * Publish all quizzes from one course to the free site.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const result = await publishCourseToFreeSite(resolvedParams.id);

    const message =
      result.failed === 0
        ? `Course published: ${result.published} quizzes published, ${result.alreadyUpToDate} already up to date.`
        : `Partial publish: ${result.published} published, ${result.alreadyUpToDate} up to date, ${result.failed} failed.`;

    return NextResponse.json({
      success: result.failed === 0,
      message,
      ...result,
    });
  } catch (error) {
    console.error('publish-course-to-free:', error);
    const message =
      error instanceof Error ? error.message : 'Course publish failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
