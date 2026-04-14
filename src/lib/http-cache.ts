import { NextResponse } from 'next/server';

type CacheOptions = {
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  maxAge?: number;
};

const DEFAULT_CACHE: Required<CacheOptions> = {
  sMaxAge: 300,
  staleWhileRevalidate: 3600,
  maxAge: 60,
};

export function buildPublicCacheControl(options?: CacheOptions): string {
  const cfg = { ...DEFAULT_CACHE, ...options };
  return `public, max-age=${cfg.maxAge}, s-maxage=${cfg.sMaxAge}, stale-while-revalidate=${cfg.staleWhileRevalidate}`;
}

export function buildNoStoreCacheControl(): string {
  return 'no-store, max-age=0';
}

export function withCacheHeaders(
  response: NextResponse,
  options?: CacheOptions
): NextResponse {
  response.headers.set('Cache-Control', buildPublicCacheControl(options));
  return response;
}

export function withNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', buildNoStoreCacheControl());
  return response;
}
