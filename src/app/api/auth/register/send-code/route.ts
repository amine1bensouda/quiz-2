import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createOrRefreshVerification, normalizeEmail } from '@/lib/registration-verification';
import { formatEmailSendError, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '');
    const password = String(body.password || '');
    const name = String(body.name || '').trim();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
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

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const { expiresAt } = await createOrRefreshVerification(
      normalizedEmail,
      name,
      password
    );

    return NextResponse.json({
      message:
        'A verification code has been sent to your email. Enter it below to complete registration.',
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      devHint:
        process.env.NODE_ENV === 'development' && !isEmailConfigured()
          ? 'Email not configured — check the server console for the code.'
          : undefined,
    });
  } catch (error: unknown) {
    const message = formatEmailSendError(error);
    if (message.includes('wait')) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    console.error('POST /api/auth/register/send-code:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
