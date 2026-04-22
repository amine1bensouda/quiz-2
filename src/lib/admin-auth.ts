import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

/**
 * Authentification admin.
 *
 * Modèle:
 * - Mot de passe stocké idéalement en hash bcrypt via `ADMIN_PASSWORD_HASH`.
 *   Fallback: `ADMIN_PASSWORD` en clair (dev uniquement).
 * - Après authentification, on dépose un cookie HttpOnly `admin_token` contenant
 *   un token signé HMAC (pas le mot de passe), non rejouable après expiration.
 *
 * Le cookie a la forme: `${issuedAtMs}.${base64url(hmacSha256(secret, "admin.v1." + issuedAtMs))}`
 * La validation se fait aussi côté middleware (Edge runtime) via Web Crypto.
 */

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const COOKIE_NAME = 'admin_token';
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
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

/**
 * Génère un token de session signé HMAC.
 * Format: `${issuedAtMs}.${hmacBase64url}`.
 */
export async function createAdminSessionToken(
  issuedAtMs: number = Date.now()
): Promise<string> {
  const secret = getSessionSecret();
  const payload = `${SIGNATURE_NAMESPACE}${issuedAtMs}`;
  const signature = await hmacSign(secret, payload);
  return `${issuedAtMs}.${signature}`;
}

/**
 * Valide un token de session admin.
 * Retourne true si:
 *  - Le format est correct
 *  - La signature HMAC est valide
 *  - Le token n'est pas expiré (SESSION_DURATION_MS)
 */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [issuedAtStr, providedSig] = parts;
  const issuedAtMs = Number(issuedAtStr);
  if (!Number.isFinite(issuedAtMs) || issuedAtMs <= 0) return false;

  const now = Date.now();
  if (now - issuedAtMs > SESSION_DURATION_MS) return false;
  if (issuedAtMs > now + 60_000) return false;

  const secret = getSessionSecret();
  const payload = `${SIGNATURE_NAMESPACE}${issuedAtMs}`;
  const expectedSig = await hmacSign(secret, payload);

  return timingSafeEqual(expectedSig, providedSig);
}

/**
 * Vérifie un mot de passe contre le hash bcrypt (ou fallback clair) configuré.
 */
async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  const plain = process.env.ADMIN_PASSWORD || 'admin123';
  return timingSafeEqual(password, plain);
}

/**
 * Vérifie si l'utilisateur est authentifié en tant qu'admin (server components).
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

/**
 * Authentifie l'admin avec un mot de passe et dépose le cookie de session signé.
 */
export async function authenticateAdmin(password: string): Promise<boolean> {
  const ok = await verifyAdminPassword(password);
  if (!ok) return false;

  const token = await createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
  return true;
}

/**
 * Déconnecte l'admin.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Helper pour protéger une route API admin.
 */
export async function requireAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    throw new Error('Unauthorized');
  }
}
