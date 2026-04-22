import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const adminApiWindowMs = 60_000;
const adminApiMaxRequests = 120;
const adminApiHits = new Map<string, { count: number; windowStart: number }>();

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SIGNATURE_NAMESPACE = 'admin.v1.';

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    'change-me-in-production'
  );
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  return base64UrlEncode(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [issuedAtStr, providedSig] = parts;
  const issuedAtMs = Number(issuedAtStr);
  if (!Number.isFinite(issuedAtMs) || issuedAtMs <= 0) return false;

  const now = Date.now();
  if (now - issuedAtMs > SESSION_DURATION_MS) return false;
  if (issuedAtMs > now + 60_000) return false;

  const expectedSig = await hmacSign(
    getSessionSecret(),
    `${SIGNATURE_NAMESPACE}${issuedAtMs}`
  );
  return timingSafeEqual(expectedSig, providedSig);
}

/**
 * Routes /api/admin/* publiques (sans auth) : uniquement l'endpoint de login.
 */
function isPublicAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin/auth/');
}

function isAdminApiRequest(pathname: string): boolean {
  return pathname.startsWith('/api/admin/');
}

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protection auth: bloquer les accès non-authentifiés aux routes /api/admin/*
  // sauf l'endpoint de login.
  if (isAdminApiRequest(pathname) && !isPublicAdminApi(pathname)) {
    const token = request.cookies.get('admin_token')?.value;
    const valid = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Protection légère anti-burst sur /api/admin/* (instance locale/process only).
  const rateLimitOn = process.env.API_ADMIN_RATE_LIMIT !== '0';
  if (rateLimitOn && isAdminApiRequest(pathname)) {
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
