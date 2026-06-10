import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword, comparePassword } from '@/lib/auth-utils';
import { sendVerificationCodeEmail } from '@/lib/email';

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function createOrRefreshVerification(
  email: string,
  name: string,
  password: string
): Promise<{ expiresAt: Date }> {
  const normalizedEmail = normalizeEmail(email);
  const code = generateVerificationCode();
  const codeHash = await hashPassword(code);
  const passwordHash = await hashPassword(password);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  const now = new Date();

  const existing = await prisma.registrationVerification.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing && now.getTime() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_MS - (now.getTime() - existing.lastSentAt.getTime())) / 1000
    );
    throw new Error(`Please wait ${waitSec} seconds before requesting a new code.`);
  }

  await prisma.registrationVerification.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
    update: {
      name: name.trim(),
      passwordHash,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
  });

  await sendVerificationCodeEmail(normalizedEmail, name.trim(), code);

  return { expiresAt };
}

export async function verifyCodeAndCreateUser(
  email: string,
  code: string
): Promise<{ id: string; email: string; name: string; createdAt: Date }> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedCode = code.trim().replace(/\s/g, '');

  if (!/^\d{6}$/.test(trimmedCode)) {
    throw new Error('Invalid verification code format.');
  }

  const pending = await prisma.registrationVerification.findUnique({
    where: { email: normalizedEmail },
  });

  if (!pending) {
    throw new Error('No pending registration found. Please start again.');
  }

  if (pending.expiresAt < new Date()) {
    await prisma.registrationVerification.delete({ where: { email: normalizedEmail } });
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.registrationVerification.delete({ where: { email: normalizedEmail } });
    throw new Error('Too many failed attempts. Please request a new code.');
  }

  const valid = await comparePassword(trimmedCode, pending.codeHash);

  if (!valid) {
    await prisma.registrationVerification.update({
      where: { email: normalizedEmail },
      data: { attempts: { increment: 1 } },
    });
    throw new Error('Invalid verification code.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    await prisma.registrationVerification.delete({ where: { email: normalizedEmail } });
    throw new Error('Email already registered.');
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: pending.name,
      password: pending.passwordHash,
      emailVerified: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  await prisma.registrationVerification.delete({ where: { email: normalizedEmail } });

  return user;
}
