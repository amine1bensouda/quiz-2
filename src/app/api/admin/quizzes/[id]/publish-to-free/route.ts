import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { publishQuizToFreeSite } from '@/lib/sync/publish-quiz';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/quizzes/[id]/publish-to-free
 * Publish one quiz to the free site.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizId = params.id;
    const result = await publishQuizToFreeSite(quizId);

    return NextResponse.json({
      success: true,
      message: result.alreadyUpToDate
        ? 'Quiz already up to date on free site'
        : 'Quiz published to free site',
      ...result,
    });
  } catch (error) {
    console.error('publish-to-free:', error);
    const message =
      error instanceof Error ? error.message : 'Publishing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
