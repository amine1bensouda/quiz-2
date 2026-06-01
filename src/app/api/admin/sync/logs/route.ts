import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sync/logs?quizId=&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const quizId = searchParams.get('quizId')?.trim();
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get('limit')) || 50)
    );

    const logs = await prisma.syncLog.findMany({
      where: quizId ? { quizId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        quiz: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('sync logs:', error);
    return NextResponse.json(
      { error: 'Failed to load sync logs' },
      { status: 500 }
    );
  }
}
