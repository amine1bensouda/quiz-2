import type Stripe from 'stripe';
import { SITE_BRAND_UPPER } from '@/lib/constants';

/** Dark checkout theme aligned with site (#080810 / #12121f / #f5c14a). */
export function getStripeCheckoutBrandingSettings(): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  return {
    display_name: SITE_BRAND_UPPER,
    background_color: '#12121f',
    button_color: '#f5c14a',
    border_style: 'rounded',
    font_family: 'inter',
  };
}
