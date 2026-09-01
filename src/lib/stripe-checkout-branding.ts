import { SITE_BRAND_UPPER } from '@/lib/constants';

/** Dark checkout theme aligned with site (#080810 / #12121f / #f5c14a). */
export function getStripeCheckoutBrandingSettings() {
  return {
    display_name: SITE_BRAND_UPPER,
    background_color: '#12121f',
    button_color: '#f5c14a',
    border_style: 'rounded' as const,
    font_family: 'inter',
  };
}
