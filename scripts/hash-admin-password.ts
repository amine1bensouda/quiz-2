/**
 * Génère un hash bcrypt pour le mot de passe admin.
 *
 * Usage:
 *   npm run admin:hash -- "mon-mot-de-passe-tres-fort"
 *   # ou
 *   npx tsx scripts/hash-admin-password.ts "mon-mot-de-passe-tres-fort"
 *
 * Copie ensuite la valeur dans ton .env:
 *   ADMIN_PASSWORD_HASH=$2a$12$...
 *
 * Et pense à définir aussi:
 *   ADMIN_SESSION_SECRET=<chaîne aléatoire longue>
 */

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Error: password argument is required.');
    console.error('Usage: npx tsx scripts/hash-admin-password.ts "your-password"');
    process.exit(1);
  }

  if (password.length < 10) {
    console.warn(
      'Warning: mot de passe court (<10 caractères). Utilise au moins 12-16 caractères pour la production.'
    );
  }

  const rounds = 12;
  const hash = await bcrypt.hash(password, rounds);
  const sessionSecret = crypto.randomBytes(48).toString('base64url');

  console.log('\n=== Admin credentials (à copier dans .env) ===\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
  console.log(
    '\nNote: après avoir ajouté ces valeurs, tu peux supprimer ADMIN_PASSWORD du .env.'
  );
  console.log(
    'Les sessions admin existantes seront invalidées (cookies devront être regénérés via login).\n'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
