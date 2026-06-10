import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
}

/**
 * Direct registration is disabled — email verification is required.
 * Use POST /api/auth/register/send-code then /api/auth/register/verify
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Email verification is required. Use send-code and verify endpoints.',
      steps: [
        'POST /api/auth/register/send-code',
        'POST /api/auth/register/verify',
      ],
    },
    { status: 400 }
  );
}
