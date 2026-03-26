import type { NextRequest } from 'next/server';

/**
 * Standardise la détection de `?full=1` sur Request/NextRequest.
 */
export function isFullRequest(request: Request | NextRequest): boolean {
  const searchParams = 'nextUrl' in request
    ? request.nextUrl.searchParams
    : new URL(request.url).searchParams;

  const full = searchParams.get('full');
  return full === '1' || full === 'true';
}
