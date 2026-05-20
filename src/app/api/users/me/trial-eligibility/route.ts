import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { canUserStartFreeTrial } from '@/lib/trial-eligibility';
import { addResponseObservability } from '@/lib/traffic-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/me/trial-eligibility
 * Returns whether the logged-in user can still use the one-time 48h free trial.
 */
export async function GET() {
  const startTime = Date.now();
  try {
    const user = await getCurrentUserFromSession();
    if (!user) {
      return addResponseObservability(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        startTime,
        '/api/users/me/trial-eligibility'
      );
    }

    const eligible = await canUserStartFreeTrial(user.id);
    return addResponseObservability(
      NextResponse.json({ eligible, trialHours: 48 }),
      startTime,
      '/api/users/me/trial-eligibility'
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to check trial eligibility';
    return addResponseObservability(
      NextResponse.json({ error: message }, { status: 500 }),
      startTime,
      '/api/users/me/trial-eligibility'
    );
  }
}
