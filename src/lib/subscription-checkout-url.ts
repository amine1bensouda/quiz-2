export const CHECKOUT_AUTO_PARAM = 'startCheckout';

export type CheckoutProvider = 'stripe' | 'paypal';

export function sanitizeRedirectPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }
  return path;
}

export function buildReturnUrlWithCheckout(
  returnUrl: string,
  options?: { courseId?: string; provider?: CheckoutProvider }
): string {
  const [base, query] = returnUrl.split('?');
  const params = new URLSearchParams(query ?? '');
  params.set(CHECKOUT_AUTO_PARAM, options?.provider ?? 'stripe');
  if (options?.courseId) {
    params.set('courseId', options.courseId);
  }
  return `${base}?${params.toString()}`;
}

export function buildAuthUrl(
  kind: 'login' | 'register',
  returnUrl: string,
  options?: { courseId?: string; provider?: CheckoutProvider }
): string {
  const redirect = buildReturnUrlWithCheckout(returnUrl, options);
  return `/${kind}?redirect=${encodeURIComponent(redirect)}`;
}

export function parseCheckoutIntent(
  value: string | string[] | undefined
): CheckoutProvider | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'stripe' || raw === 'paypal') {
    return raw;
  }
  return null;
}
