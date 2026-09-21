/**
 * Short-lived signed tokens so admins can preview draft courses
 * even if the admin_token cookie is missing on the public course page.
 */

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const NAMESPACE = 'course-preview.v1.';

function getSecret(): string {
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
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
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

/** Format: `${slug}.${expiresAtMs}.${hmac}` */
export async function createCoursePreviewToken(slug: string): Promise<string> {
  const expiresAtMs = Date.now() + TOKEN_TTL_MS;
  const payload = `${NAMESPACE}${slug}.${expiresAtMs}`;
  const signature = await hmacSign(getSecret(), payload);
  return `${encodeURIComponent(slug)}.${expiresAtMs}.${signature}`;
}

export async function verifyCoursePreviewToken(
  slug: string,
  token: string | null | undefined
): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [encodedSlug, expiresAtStr, providedSig] = parts;
  let tokenSlug: string;
  try {
    tokenSlug = decodeURIComponent(encodedSlug);
  } catch {
    return false;
  }

  if (tokenSlug !== slug) return false;

  const expiresAtMs = Number(expiresAtStr);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return false;

  const payload = `${NAMESPACE}${slug}.${expiresAtMs}`;
  const expectedSig = await hmacSign(getSecret(), payload);
  return timingSafeEqual(expectedSig, providedSig);
}
