import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getAccessibleCoursesForUser } from '@/lib/course-service';
import { syncStripeSubscriptionForUser } from '@/lib/subscription-access';
import { withNoStoreHeaders } from '@/lib/http-cache';
import { addResponseObservability } from '@/lib/traffic-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses/accessible
 * Courses the signed-in user can practice (purchased / trialing / ALL_ACCESS).
 */
export async function GET() {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/courses/accessible'
      );
    }

    await syncStripeSubscriptionForUser(user.id);
    const isAdmin = await isAdminAuthenticated();
    const courses = await getAccessibleCoursesForUser(user.id, isAdmin);

    return addResponseObservability(
      withNoStoreHeaders(NextResponse.json(courses)),
      startTime,
      '/api/courses/accessible'
    );
  } catch (error) {
    console.error('Accessible courses API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addResponseObservability(
      NextResponse.json({ error: 'Failed to fetch accessible courses', message }, { status: 500 }),
      startTime,
      '/api/courses/accessible'
    );
  }
}
