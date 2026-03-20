import { NextRequest, NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    await logoutAdmin();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
