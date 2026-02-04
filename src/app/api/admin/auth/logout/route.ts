import { NextRequest, NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    await logoutAdmin();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur déconnexion admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
