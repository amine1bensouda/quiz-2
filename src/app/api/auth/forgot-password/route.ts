import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetRequest } from '@/lib/password-reset';
import { formatEmailSendError, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SUCCESS_MESSAGE =
  'If an account exists with this email, you will receive a password reset link shortly.';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'production' && !isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email service is not configured. Contact the administrator.' },
        { status: 503 }
      );
    }

    const { devResetUrl } = await createPasswordResetRequest(email);

    return NextResponse.json({
      message: SUCCESS_MESSAGE,
      devHint:
        process.env.NODE_ENV === 'development' && devResetUrl
          ? 'Email not configured — use the reset link shown below or check the server console.'
          : undefined,
      devResetUrl: process.env.NODE_ENV === 'development' ? devResetUrl : undefined,
    });
  } catch (error: unknown) {
    const message = formatEmailSendError(error);
    if (message.includes('wait')) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    console.error('POST /api/auth/forgot-password:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
