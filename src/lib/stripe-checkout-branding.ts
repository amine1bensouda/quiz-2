import { SITE_BRAND_UPPER } from '@/lib/constants';

/** Session-level branding for Stripe Checkout API. */
export function getStripeCheckoutBrandingSettings() {
  return {
    display_name: SITE_BRAND_UPPER,
    background_color: '#12121f',
    button_color: '#f5c14a',
    border_style: 'rounded' as const,
    font_family: 'inter' as const,
  };
}

/** Client-side Appearance API — full dark theme for embedded form. */
export function getStripeCheckoutAppearance() {
  return {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#f5c14a',
      colorBackground: '#12121f',
      colorText: '#eeeaf4',
      colorTextSecondary: 'rgba(238, 234, 244, 0.65)',
      colorTextPlaceholder: 'rgba(238, 234, 244, 0.35)',
      colorDanger: '#f87171',
      borderRadius: '12px',
      fontFamily: 'Inter, system-ui, sans-serif',
      buttonColorBackground: '#f5c14a',
      buttonColorText: '#0c0a00',
    },
  };
}
