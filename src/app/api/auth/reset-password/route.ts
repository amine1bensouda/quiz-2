import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim();
    const token = String(body.token || '').trim();
    const password = String(body.password || '');

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, token, and new password are required' },
        { status: 400 }
      );
    }

    await resetPasswordWithToken(email, token, password);

    return NextResponse.json({
      message: 'Your password has been updated. You can now sign in.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Password reset failed';
    console.error('POST /api/auth/reset-password:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
