/**
 * Mini-client PayPal basé sur fetch.
 * Couvre l'API Billing (Products / Plans / Subscriptions) et la vérification
 * des signatures webhook. On n'utilise pas `@paypal/checkout-server-sdk`
 * (deprecated) ni l'API Orders v2 (on est désormais sur des subscriptions).
 */

type PaypalEnv = 'sandbox' | 'live';

function getPaypalEnv(): PaypalEnv {
  const raw = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
  return raw === 'live' || raw === 'production' ? 'live' : 'sandbox';
}

export function getPaypalBaseUrl(): string {
  return getPaypalEnv() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getPaypalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET must be set in the environment.'
    );
  }
  return { clientId, clientSecret };
}

// Cache en mémoire du token (access tokens PayPal durent environ 9h).
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getPaypalAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = getPaypalCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal auth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Catalog (Products / Plans) — utilisé par scripts/paypal-setup-plans.ts.
// ---------------------------------------------------------------------------

export interface PaypalProduct {
  id: string;
  name: string;
  [k: string]: unknown;
}

export interface PaypalPlan {
  id: string;
  product_id: string;
  name: string;
  status: string;
  [k: string]: unknown;
}

export async function createPaypalProduct(input: {
  name: string;
  description?: string;
  type?: 'DIGITAL' | 'SERVICE' | 'PHYSICAL';
  category?: string;
}): Promise<PaypalProduct> {
  const token = await getPaypalAccessToken();
  const body: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    type: input.type ?? 'SERVICE',
  };
  if (input.category) {
    body.category = input.category;
  }
  const res = await fetch(`${getPaypalBaseUrl()}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as PaypalProduct;
  if (!res.ok) {
    throw new Error(
      `PayPal create product failed (${res.status}): ${JSON.stringify(data)}`
    );
  }
  return data;
}

export async function createPaypalPlan(input: {
  productId: string;
  name: string;
  description?: string;
  currency: string;
  amountCents: number;
  intervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  intervalCount?: number;
  trialDays?: number;
}): Promise<PaypalPlan> {
  const token = await getPaypalAccessToken();

  const intervalUnit = input.intervalUnit ?? 'MONTH';
  const intervalCount = input.intervalCount ?? 1;
  const amountValue = (input.amountCents / 100).toFixed(2);

  const billingCycles: any[] = [];
  let sequence = 1;
  if (input.trialDays && input.trialDays > 0) {
    billingCycles.push({
      frequency: { interval_unit: 'DAY', interval_count: input.trialDays },
      tenure_type: 'TRIAL',
      sequence: sequence++,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: { value: '0', currency_code: input.currency.toUpperCase() },
      },
    });
  }
  billingCycles.push({
    frequency: { interval_unit: intervalUnit, interval_count: intervalCount },
    tenure_type: 'REGULAR',
    sequence,
    total_cycles: 0, // infini
    pricing_scheme: {
      fixed_price: {
        value: amountValue,
        currency_code: input.currency.toUpperCase(),
      },
    },
  });

  const res = await fetch(`${getPaypalBaseUrl()}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: input.productId,
      name: input.name,
      description: input.description,
      status: 'ACTIVE',
      billing_cycles: billingCycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 2,
      },
    }),
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => ({}))) as PaypalPlan;
  if (!res.ok) {
    throw new Error(
      `PayPal create plan failed (${res.status}): ${JSON.stringify(data)}`
    );
  }
  return data;
}

// ---------------------------------------------------------------------------
// Subscriptions.
// ---------------------------------------------------------------------------

export interface PaypalSubscription {
  id: string;
  status: string;
  plan_id?: string;
  start_time?: string;
  create_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string; amount?: { value: string; currency_code: string } };
  };
  subscriber?: {
    email_address?: string;
    payer_id?: string;
  };
  custom_id?: string;
  links?: Array<{ href: string; rel: string; method: string }>;
  [k: string]: unknown;
}

export async function createPaypalSubscription(input: {
  planId: string;
  customId: string;
  returnUrl: string;
  cancelUrl: string;
  subscriberEmail?: string;
  subscriberName?: { givenName?: string; surname?: string };
  startTime?: Date;
}): Promise<{ subscription: PaypalSubscription; approveUrl: string | null }> {
  const token = await getPaypalAccessToken();

  const body: Record<string, unknown> = {
    plan_id: input.planId,
    custom_id: input.customId,
    application_context: {
      brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'Quiz Platform',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
    },
  };
  if (input.subscriberEmail || input.subscriberName) {
    body.subscriber = {
      ...(input.subscriberEmail ? { email_address: input.subscriberEmail } : {}),
      ...(input.subscriberName
        ? {
            name: {
              given_name: input.subscriberName.givenName,
              surname: input.subscriberName.surname,
            },
          }
        : {}),
    };
  }
  if (input.startTime) {
    body.start_time = input.startTime.toISOString();
  }

  const res = await fetch(`${getPaypalBaseUrl()}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => ({}))) as PaypalSubscription;
  if (!res.ok) {
    throw new Error(
      `PayPal create subscription failed (${res.status}): ${JSON.stringify(data)}`
    );
  }
  const approveLink =
    data.links?.find((l) => l.rel === 'approve')?.href ?? null;
  return { subscription: data, approveUrl: approveLink };
}

export async function getPaypalSubscription(
  subscriptionId: string
): Promise<PaypalSubscription> {
  const token = await getPaypalAccessToken();
  const res = await fetch(
    `${getPaypalBaseUrl()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );
  const data = (await res.json().catch(() => ({}))) as PaypalSubscription;
  if (!res.ok) {
    throw new Error(
      `PayPal get subscription failed (${res.status}): ${JSON.stringify(data)}`
    );
  }
  return data;
}

export async function cancelPaypalSubscription(
  subscriptionId: string,
  reason = 'User requested cancellation'
): Promise<void> {
  const token = await getPaypalAccessToken();
  const res = await fetch(
    `${getPaypalBaseUrl()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
      cache: 'no-store',
    }
  );
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal cancel subscription failed (${res.status}): ${text}`);
  }
}

/**
 * Normalise le statut PayPal (APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED
 * | CANCELLED | EXPIRED) vers notre modèle interne.
 */
export function normalizePaypalStatus(status: string | undefined | null): string {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'APPROVAL_PENDING':
    case 'APPROVED':
      // `approved` = user a validé côté PayPal mais `ACTIVE` pas encore émis,
      // on traite comme trialing en attendant le webhook (ou on met incomplete).
      return 'incomplete';
    case 'SUSPENDED':
      return 'past_due';
    case 'CANCELLED':
      return 'canceled';
    case 'EXPIRED':
      return 'expired';
    default:
      return (status ?? '').toLowerCase() || 'incomplete';
  }
}

// ---------------------------------------------------------------------------
// Webhook signature verification.
// ---------------------------------------------------------------------------

export async function verifyPaypalWebhookSignature(input: {
  webhookId: string;
  headers: Record<string, string>;
  rawBody: string;
}): Promise<boolean> {
  const token = await getPaypalAccessToken();

  const body = {
    auth_algo: input.headers['paypal-auth-algo'] || input.headers['PAYPAL-AUTH-ALGO'],
    cert_url: input.headers['paypal-cert-url'] || input.headers['PAYPAL-CERT-URL'],
    transmission_id:
      input.headers['paypal-transmission-id'] ||
      input.headers['PAYPAL-TRANSMISSION-ID'],
    transmission_sig:
      input.headers['paypal-transmission-sig'] ||
      input.headers['PAYPAL-TRANSMISSION-SIG'],
    transmission_time:
      input.headers['paypal-transmission-time'] ||
      input.headers['PAYPAL-TRANSMISSION-TIME'],
    webhook_id: input.webhookId,
    webhook_event: JSON.parse(input.rawBody),
  };

  const res = await fetch(
    `${getPaypalBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('PayPal verify webhook signature failed:', res.status, text);
    return false;
  }
  const data = (await res.json().catch(() => ({}))) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}
