/**
 * Script one-shot pour créer les produits + plans PayPal associés
 * aux plans SINGLE_COURSE (7 USD/mois) et ALL_ACCESS (25 USD/mois),
 * chacun avec un TRIAL de 2 jours gratuit.
 *
 * Usage :
 *   npx tsx scripts/paypal-setup-plans.ts
 *
 * À exécuter une seule fois par environnement (sandbox / live).
 * Copiez ensuite les IDs affichés dans .env.local / .env :
 *   PAYPAL_PLAN_SINGLE_COURSE_ID=...
 *   PAYPAL_PLAN_ALL_ACCESS_ID=...
 *
 * Vous pouvez relancer le script, il créera à chaque fois de nouveaux plans
 * (PayPal ne permet pas l'upsert). N'exécutez que pour bootstrap ou
 * recréer après désactivation.
 */

import { config as loadEnv } from 'dotenv';
import path from 'path';

// tsx ne charge pas automatiquement les fichiers .env de Next.js.
// On charge .env.local d'abord (priorité dev), puis .env en fallback.
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const { createPaypalPlan, createPaypalProduct } = await import('../src/lib/paypal');
  const { PLANS } = await import('../src/lib/plans');

  console.log('Creating PayPal product (catalog)...');
  const product = await createPaypalProduct({
    name: 'Quiz Platform Subscription',
    description: 'Accès aux cours et quizzes de Quiz Platform.',
    type: 'SERVICE',
  });
  console.log(`Product: ${product.id} (${product.name})`);

  const defs: Array<{ key: keyof typeof PLANS; name: string; description: string }> = [
    {
      key: 'SINGLE_COURSE',
      name: 'Single Course — 7 USD / month',
      description:
        'Accès complet à un cours au choix. 48h d\'essai gratuit. 7 USD par mois ensuite.',
    },
    {
      key: 'ALL_ACCESS',
      name: 'All Access — 25 USD / month',
      description:
        'Accès à tous les cours du catalogue. 48h d\'essai gratuit. 25 USD par mois ensuite.',
    },
  ];

  for (const def of defs) {
    const cfg = PLANS[def.key];
    const plan = await createPaypalPlan({
      productId: product.id,
      name: def.name,
      description: def.description,
      currency: 'USD',
      amountCents: cfg.priceCents,
      intervalUnit: 'MONTH',
      intervalCount: 1,
      trialDays: 2, // PayPal granularity => 2 days ~ 48h
    });
    console.log(`Plan ${def.key}: ${plan.id}`);
  }

  console.log('\nDone. Add the plan IDs to your .env :');
  console.log('  PAYPAL_PLAN_SINGLE_COURSE_ID=<id above>');
  console.log('  PAYPAL_PLAN_ALL_ACCESS_ID=<id above>');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
