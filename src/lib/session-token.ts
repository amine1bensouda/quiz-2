import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD_HASH?.trim() ||
    'dev-session-secret-change-me'
  );
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

/**
 * Token mobile/web signé : userId.expiresAt.signature
 * Compatible cookie session_token et Authorization Bearer.
 */
export function createSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest();
  return `${base64UrlEncode(payload)}.${base64UrlEncode(signature)}`;
}

export function parseSessionToken(token: string | undefined | null): {
  userId: string;
  expiresAt: number;
} | null {
  if (!token) return null;
  const trimmed = token.trim();

  // Nouveau format signé
  const parts = trimmed.split('.');
  if (parts.length === 2) {
    try {
      const payload = base64UrlDecode(parts[0]).toString('utf8');
      const providedSig = base64UrlDecode(parts[1]);
      const expectedSig = createHmac('sha256', getSessionSecret())
        .update(payload)
        .digest();
      if (
        providedSig.length !== expectedSig.length ||
        !timingSafeEqual(providedSig, expectedSig)
      ) {
        return null;
      }
      const [userId, expiresAtRaw] = payload.split('.');
      const expiresAt = Number(expiresAtRaw);
      if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
        return null;
      }
      return { userId, expiresAt };
    } catch {
      return null;
    }
  }

  // Ancien format legacy: `${userId}-${timestamp}`
  const legacyUserId = trimmed.split('-')[0];
  if (!legacyUserId) return null;
  return { userId: legacyUserId, expiresAt: Date.now() + SESSION_TTL_MS };
}
