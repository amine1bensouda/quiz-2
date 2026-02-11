import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    const authenticated = await authenticateAdmin(password);

    if (authenticated) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }
  } catch (error: any) {
      console.error('Admin authentication error:', error);
      return NextResponse.json(
        { error: 'Server error' },
      { status: 500 }
    );
  }
}
