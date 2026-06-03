/**
 * Stripe Payment Link (buy.stripe.com/...) with URL parameters.
 * @see https://docs.stripe.com/payment-links/url-parameters
 */
export function getStripePaymentLinkBaseUrl(): string | null {
  const raw = process.env.STRIPE_PAYMENT_LINK_URL?.trim();
  return raw || null;
}

export function buildStripePaymentLinkUrl(params: {
  clientReferenceId: string;
  email: string;
}): string {
  const base = getStripePaymentLinkBaseUrl();
  if (!base) {
    throw new Error('STRIPE_PAYMENT_LINK_URL is not configured.');
  }

  const url = new URL(base);
  url.searchParams.set('client_reference_id', params.clientReferenceId);
  url.searchParams.set('prefilled_email', params.email);
  return url.toString();
}
