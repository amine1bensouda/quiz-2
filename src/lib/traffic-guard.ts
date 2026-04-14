import { NextResponse } from 'next/server';

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Counter = {
  count: number;
  resetAt: number;
};

const memoryCounters = new Map<string, Counter>();

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp || 'unknown';
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const current = memoryCounters.get(key);

  if (!current || now >= current.resetAt) {
    memoryCounters.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, options.max - 1),
      retryAfter: Math.ceil(options.windowMs / 1000),
    };
  }

  current.count += 1;
  memoryCounters.set(key, current);

  const allowed = current.count <= options.max;
  return {
    allowed,
    remaining: Math.max(0, options.max - current.count),
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function tooManyRequestsJson(
  retryAfterSeconds: number,
  details = 'Rate limit exceeded'
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      details,
    },
    { status: 429 }
  );
  response.headers.set('Retry-After', String(retryAfterSeconds));
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export function addResponseObservability(
  response: NextResponse,
  startTimeMs: number,
  routeName: string
): NextResponse {
  const durationMs = Date.now() - startTimeMs;
  response.headers.set('X-Response-Time-Ms', String(durationMs));
  response.headers.set('Server-Timing', `app;desc="${routeName}";dur=${durationMs}`);
  return response;
}
