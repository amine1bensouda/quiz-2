import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCodeAndCreateUser } from '@/lib/registration-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '');
    const code = String(body.code || '');

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const user = await verifyCodeAndCreateUser(email, code);

    const sessionToken = `${user.id}-${Date.now()}`;
    const cookieStore = await cookies();
    const isProduction = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';

    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json(
      {
        user,
        message: 'Account created and verified successfully',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Verification failed';
    const status =
      message.includes('Invalid') ||
      message.includes('expired') ||
      message.includes('No pending') ||
      message.includes('Too many')
        ? 400
        : message.includes('already registered')
          ? 409
          : 500;

    console.error('POST /api/auth/register/verify:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
