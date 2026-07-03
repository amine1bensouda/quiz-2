import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email';
import { normalizeEmail } from '@/lib/registration-verification';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, '') ||
    'https://crackthecurve.com'
  );
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createPasswordResetRequest(
  email: string
): Promise<{ devResetUrl?: string }> {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return {};
  }

  const existing = await prisma.passwordReset.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing && now.getTime() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_MS - (now.getTime() - existing.lastSentAt.getTime())) / 1000
    );
    throw new Error(`Please wait ${waitSec} seconds before requesting another reset link.`);
  }

  const token = generateResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

  await prisma.passwordReset.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      tokenHash,
      expiresAt,
      lastSentAt: now,
    },
    update: {
      tokenHash,
      expiresAt,
      lastSentAt: now,
    },
  });

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[password-reset:dev] Reset URL:', resetUrl);
      return { devResetUrl: resetUrl };
    }
    throw new Error('Email service is not configured. Contact the administrator.');
  }

  await sendPasswordResetEmail(normalizedEmail, user.name, resetUrl);

  return {};
}

export async function resetPasswordWithToken(
  email: string,
  token: string,
  newPassword: string
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    throw new Error('Invalid or expired reset link.');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const pending = await prisma.passwordReset.findUnique({
    where: { email: normalizedEmail },
  });

  if (!pending || pending.expiresAt < new Date()) {
    if (pending) {
      await prisma.passwordReset.delete({ where: { email: normalizedEmail } });
    }
    throw new Error('Invalid or expired reset link. Please request a new one.');
  }

  const tokenHash = hashToken(trimmedToken);
  if (tokenHash !== pending.tokenHash) {
    throw new Error('Invalid or expired reset link.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: passwordHash },
    }),
    prisma.passwordReset.delete({
      where: { email: normalizedEmail },
    }),
  ]);
}
