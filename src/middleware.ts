import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const adminApiWindowMs = 60_000;
const adminApiMaxRequests = 120;
const adminApiHits = new Map<string, { count: number; windowStart: number }>();

/**
 * Quand SITE_UNDER_CONSTRUCTION=1, toutes les pages (sauf API, assets, /maintenance)
 * affichent l’écran « under construction » via rewrite interne vers /maintenance.
 * Désactiver : SITE_UNDER_CONSTRUCTION=0 ou supprimer la variable.
 */
/**
 * Routes qui ne doivent JAMAIS être indexées par Google (comptes utilisateurs,
 * espace admin, pages d'auth, APIs). On envoie un header X-Robots-Tag qui
 * force la désindexation même si l'URL est crawlée via un lien externe.
 */
const NO_INDEX_PATH_PATTERNS = [
  /^\/login(\/|$)/,
  /^\/register(\/|$)/,
  /^\/dashboard(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/account(\/|$)/,
  /^\/profile(\/|$)/,
  /^\/maintenance(\/|$)/,
  /^\/en-construction(\/|$)/,
  /^\/api(\/|$)/,
];

function shouldBlockIndexing(pathname: string): boolean {
  return NO_INDEX_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function middleware(request: NextRequest) {
  // Protection légère anti-burst sur /api/admin/* (instance locale/process only).
  const rateLimitOn = process.env.API_ADMIN_RATE_LIMIT !== '0';
  if (rateLimitOn && request.nextUrl.pathname.startsWith('/api/admin/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const entry = adminApiHits.get(ip);
    if (!entry || now - entry.windowStart > adminApiWindowMs) {
      adminApiHits.set(ip, { count: 1, windowStart: now });
    } else {
      entry.count += 1;
      adminApiHits.set(ip, entry);
      if (entry.count > adminApiMaxRequests) {
        return NextResponse.json(
          { error: 'Too many requests', retryAfterSeconds: 60 },
          { status: 429 }
        );
      }
    }
  }

  const { pathname } = request.nextUrl;

  // Injection du header anti-indexation sur toutes les routes privées / comptes.
  // Fonctionne même si la page est un Client Component, et empêche la page
  // d'apparaître dans Google même si elle a été crawlée via un lien externe.
  const attachNoIndexHeaders = (response: NextResponse) => {
    if (shouldBlockIndexing(pathname)) {
      response.headers.set(
        'X-Robots-Tag',
        'noindex, nofollow, noarchive, nosnippet, noimageindex'
      );
    }
    return response;
  };

  if (process.env.SITE_UNDER_CONSTRUCTION !== '1') {
    return attachNoIndexHeaders(NextResponse.next());
  }

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/maintenance') ||
    pathname === '/favicon.ico' ||
    /\.(?:ico|png|jpe?g|gif|webp|svg|woff2?|ttf|eot|txt|xml|json|webmanifest)$/i.test(
      pathname
    )
  ) {
    return attachNoIndexHeaders(NextResponse.next());
  }

  return attachNoIndexHeaders(
    NextResponse.rewrite(new URL('/maintenance', request.url))
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
