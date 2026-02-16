import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await getCurrentUserFromSession();

    // 200 avec user: null si non connecté (évite l'erreur 401 en console)
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
