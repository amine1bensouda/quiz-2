import { prisma } from '@/lib/db';
import { sendTransactionalEmail } from '@/lib/email';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { formatPlanPrice, getPlan } from '@/lib/plans';

type SubscriptionWithUser = {
  id: string;
  plan: string;
  provider: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  user: { email: string; name: string };
  course: { title: string } | null;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

async function claimPaymentEmailDedupe(dedupeKey: string): Promise<boolean> {
  try {
    await prisma.paymentEmailLog.create({ data: { dedupeKey } });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) return false;
    throw error;
  }
}

async function loadSubscriptionForEmail(
  subscriptionId: string
): Promise<SubscriptionWithUser | null> {
  return prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: { select: { email: true, name: true } },
      course: { select: { title: true } },
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function planLabel(planId: string): string {
  return getPlan(planId)?.label ?? planId;
}

function planPriceLabel(planId: string): string {
  const plan = getPlan(planId);
  return plan ? formatPlanPrice(plan) : '—';
}

function orderDetailsHtml(sub: SubscriptionWithUser): string {
  const courseLine = sub.course?.title
    ? `<tr><td style="padding:8px 0;color:#666;">Course</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(sub.course.title)}</td></tr>`
    : '';

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;color:#666;">Order ID</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(sub.id)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Plan</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(planLabel(sub.plan))}</td></tr>
      ${courseLine}
      <tr><td style="padding:8px 0;color:#666;">Billing</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(planPriceLabel(sub.plan))}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Payment method</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(sub.provider === 'paypal' ? 'PayPal' : 'Card (Stripe)')}</td></tr>
    </table>
  `;
}

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <div style="background:#0c0a00;color:#f5c14a;padding:20px 24px;border-radius:12px 12px 0 0;">
        <strong style="font-size:18px;">${escapeHtml(SITE_NAME)}</strong>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
        <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
        ${bodyHtml}
        <p style="margin-top:24px;font-size:14px;color:#666;">
          Questions? Reply to this email or visit
          <a href="${SITE_URL}/dashboard" style="color:#b45309;">your dashboard</a>.
        </p>
      </div>
    </div>
  `;
}

export async function sendSubscriptionCheckoutEmail(params: {
  subscriptionId: string;
  provider: 'stripe' | 'paypal';
}): Promise<void> {
  const dedupeKey = `${params.provider}:checkout:${params.subscriptionId}`;
  if (!(await claimPaymentEmailDedupe(dedupeKey))) return;

  const sub = await loadSubscriptionForEmail(params.subscriptionId);
  if (!sub?.user.email) return;

  const firstName = sub.user.name?.split(' ')[0] || 'there';
  const trialNote = sub.trialEndsAt
    ? `Your 48-hour free trial is active until <strong>${formatDate(sub.trialEndsAt)}</strong>. You will only be charged after the trial if you do not cancel.`
    : 'Your subscription is now active.';

  const html = emailShell(
    'Order confirmation',
    `
      <p>Hello ${escapeHtml(firstName)},</p>
      <p>Thank you for subscribing to <strong>${escapeHtml(SITE_NAME)}</strong>. Your order is confirmed.</p>
      ${orderDetailsHtml(sub)}
      <p style="background:#f9fafb;border-radius:8px;padding:14px;font-size:14px;line-height:1.6;">
        ${trialNote}
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#f5c14a;color:#0c0a00;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;">
          Go to dashboard
        </a>
      </p>
      <p style="font-size:13px;color:#666;">
        You can cancel anytime from Dashboard → Profile → Manage or cancel subscription.
      </p>
    `
  );

  const text = [
    `Hello ${firstName},`,
    '',
    `Thank you for subscribing to ${SITE_NAME}.`,
    '',
    `Order ID: ${sub.id}`,
    `Plan: ${planLabel(sub.plan)}`,
    sub.course ? `Course: ${sub.course.title}` : '',
    `Billing: ${planPriceLabel(sub.plan)}`,
    sub.trialEndsAt ? `Trial ends: ${formatDate(sub.trialEndsAt)}` : '',
    '',
    `Dashboard: ${SITE_URL}/dashboard`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendTransactionalEmail({
      to: sub.user.email,
      subject: `${SITE_NAME} — Order confirmation`,
      html,
      text,
    });
  } catch (error) {
    await prisma.paymentEmailLog.delete({ where: { dedupeKey } }).catch(() => undefined);
    throw error;
  }
}

export async function sendSubscriptionInvoiceEmail(params: {
  subscriptionId: string;
  provider: 'stripe' | 'paypal';
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  invoiceUrl?: string | null;
  paidAt?: Date | null;
}): Promise<void> {
  if (params.amountCents <= 0) return;

  const dedupeKey = `${params.provider}:invoice:${params.invoiceNumber}`;
  if (!(await claimPaymentEmailDedupe(dedupeKey))) return;

  const sub = await loadSubscriptionForEmail(params.subscriptionId);
  if (!sub?.user.email) return;

  const firstName = sub.user.name?.split(' ')[0] || 'there';
  const amountLabel = formatMoney(params.amountCents, params.currency);
  const invoiceLink = params.invoiceUrl
    ? `<p style="text-align:center;margin:24px 0;">
        <a href="${params.invoiceUrl.replace(/"/g, '%22')}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
          View invoice
        </a>
      </p>`
    : '';

  const html = emailShell(
    'Payment receipt',
    `
      <p>Hello ${escapeHtml(firstName)},</p>
      <p>We received your payment of <strong>${escapeHtml(amountLabel)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#666;">Invoice</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(params.invoiceNumber)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Amount paid</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(amountLabel)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Date</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(formatDate(params.paidAt ?? new Date()))}</td></tr>
      </table>
      ${orderDetailsHtml(sub)}
      ${invoiceLink}
    `
  );

  const text = [
    `Hello ${firstName},`,
    '',
    `Payment received: ${amountLabel}`,
    `Invoice: ${params.invoiceNumber}`,
    `Date: ${formatDate(params.paidAt ?? new Date())}`,
    '',
    `Order ID: ${sub.id}`,
    `Plan: ${planLabel(sub.plan)}`,
    sub.course ? `Course: ${sub.course.title}` : '',
    params.invoiceUrl ? `Invoice: ${params.invoiceUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendTransactionalEmail({
      to: sub.user.email,
      subject: `${SITE_NAME} — Payment receipt (${params.invoiceNumber})`,
      html,
      text,
    });
  } catch (error) {
    await prisma.paymentEmailLog.delete({ where: { dedupeKey } }).catch(() => undefined);
    throw error;
  }
}

export async function sendPaypalPaymentReceiptEmail(params: {
  subscriptionId: string;
  transactionId: string;
  amountCents: number;
  currency: string;
  paidAt?: Date | null;
}): Promise<void> {
  await sendSubscriptionInvoiceEmail({
    subscriptionId: params.subscriptionId,
    provider: 'paypal',
    invoiceNumber: params.transactionId,
    amountCents: params.amountCents,
    currency: params.currency,
    paidAt: params.paidAt,
  });
}
