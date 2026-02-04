import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await getCurrentUserFromSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
