import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error('Admin status error:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
