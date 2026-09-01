import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { comparePassword, hashPassword } from '@/lib/auth-utils';
import { createSessionToken } from '@/lib/session-token';
import { normalizeEmail } from '@/lib/registration-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/checkout/account
 * Login or create account during embedded checkout (no email verification step).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '');
    const password = String(body.password || '');
    const confirmPassword = String(body.confirmPassword || '');
    const name = String(body.name || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let user: { id: string; email: string; name: string; createdAt: Date };

    if (existingUser) {
      const valid = await comparePassword(password, existingUser.password);
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid email or password. Sign in with your existing account password.' },
          { status: 401 }
        );
      }
      user = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        createdAt: existingUser.createdAt,
      };
    } else {
      if (password !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
      }
      if (!name || name.length < 2) {
        return NextResponse.json(
          { error: 'Full name is required (at least 2 characters)' },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(password);
      const created = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          password: passwordHash,
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
      user = created;
    }

    const sessionToken = createSessionToken(user.id);
    const cookieStore = await cookies();
    const isProduction =
      Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';

    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      user,
      token: sessionToken,
      message: existingUser ? 'Signed in' : 'Account created',
    });
  } catch (error: unknown) {
    console.error('POST /api/checkout/account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Account step failed' },
      { status: 500 }
    );
  }
}
