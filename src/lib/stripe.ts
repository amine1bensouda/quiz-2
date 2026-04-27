import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Renvoie une instance Stripe (lazy singleton). Lance si la clé est absente :
 * toutes les routes de paiement doivent échouer proprement dans ce cas plutôt
 * que de partir sur une instance mal configurée.
 */
export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Set it in your environment.'
    );
  }

  // On laisse Stripe choisir la version d'API liée au compte (évite de
  // lier la build à un slug de version précis qui peut être renommé
  // entre deux releases de la lib).
  stripeInstance = new Stripe(secretKey, {
    typescript: true,
  } as any);

  return stripeInstance;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return secret;
}
