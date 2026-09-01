import { NextResponse } from 'next/server';
import {
  getSessionTokenFromRequest,
  getUserBySessionToken,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const sessionToken = await getSessionTokenFromRequest();
    const user = await getUserBySessionToken(sessionToken);

    if (!user) {
      const response = NextResponse.json({ user: null }, { status: 401 });
      if (sessionToken) {
        response.cookies.set('session_token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        });
      }
      return response;
    }

    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
