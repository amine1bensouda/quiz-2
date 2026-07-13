/**
 * Script one-shot pour créer les produits + prices Stripe associés
 * aux plans SINGLE_COURSE (7 USD/mois) et ALL_ACCESS (25 USD/mois).
 *
 * Usage :
 *   npx tsx scripts/stripe-setup-prices.ts
 *
 * Pré-requis : STRIPE_SECRET_KEY doit être renseigné dans .env.local
 * (utilisez sk_test_... pour créer des prix en mode Test).
 *
 * À exécuter une seule fois par environnement (test / live).
 * Copiez ensuite les IDs affichés dans .env.local / .env :
 *   STRIPE_PRICE_SINGLE_COURSE_ID=price_...
 *   STRIPE_PRICE_ALL_ACCESS_ID=price_...
 *
 * Relancer le script créera de nouveaux produits/prices à chaque exécution.
 * Le trial 48h est géré côté serveur dans /api/subscriptions/stripe/checkout,
 * donc on ne configure PAS de trial sur le price Stripe ici.
 */

import { config as loadEnv } from 'dotenv';
import path from 'path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env') });

import { getStripe } from '../src/lib/stripe';
import { PLANS, CURRENCY, BILLING_INTERVAL } from '../src/lib/plans';

async function createRecurringPrice(params: {
  name: string;
  description: string;
  priceCents: number;
}) {
  const stripe = getStripe();

  console.log(`\nCreating Stripe product: ${params.name}...`);
  const product = await stripe.products.create({
    name: params.name,
    description: params.description,
  });
  console.log(`  Product: ${product.id}`);

  console.log('  Creating recurring price...');
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: params.priceCents,
    currency: CURRENCY.toLowerCase(),
    recurring: { interval: BILLING_INTERVAL },
  });
  console.log(`  Price:   ${price.id} (${(params.priceCents / 100).toFixed(2)} ${CURRENCY}/${BILLING_INTERVAL})`);

  return { product, price };
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(
      'STRIPE_SECRET_KEY is missing. Add it to .env.local first, then rerun.'
    );
    process.exit(1);
  }

  const single = await createRecurringPrice({
    name: PLANS.SINGLE_COURSE.label,
    description: PLANS.SINGLE_COURSE.description,
    priceCents: PLANS.SINGLE_COURSE.priceCents,
  });

  const all = await createRecurringPrice({
    name: PLANS.ALL_ACCESS.label,
    description: PLANS.ALL_ACCESS.description,
    priceCents: PLANS.ALL_ACCESS.priceCents,
  });

  console.log('\n========================================');
  console.log('Stripe setup complete. Copy into .env.local:');
  console.log('========================================');
  console.log(`STRIPE_PRICE_SINGLE_COURSE_ID=${single.price.id}`);
  console.log(`STRIPE_PRICE_ALL_ACCESS_ID=${all.price.id}`);
  console.log('========================================\n');
}

main().catch((error) => {
  console.error('Stripe setup failed:', error);
  process.exit(1);
});
