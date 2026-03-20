/**
 * Met à jour en base tous les quiz dont la difficulté est "Hard" ou "Expert"
 * en "Advanced".
 * Exécuter une seule fois : npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/update-difficulty-hard-to-advanced.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REPLACEMENTS: [string, string][] = [
  ['Hard', 'Advanced'],
  ['Expert', 'Advanced'],
  ['Difficile', 'Advanced'],
  ['Medium', 'Intermediate'],
  ['Moyen', 'Intermediate'],
  ['Easy', 'Fundamental'],
  ['Facile', 'Fundamental'],
];

async function main() {
  console.log('Mise à jour des difficultés (Hard/Expert/Difficile → Advanced, Medium/Moyen → Intermediate)...\n');

  for (const [fromVal, toVal] of REPLACEMENTS) {
    const result = await prisma.quiz.updateMany({
      where: { difficulty: fromVal },
      data: { difficulty: toVal },
    });
    if (result.count > 0) {
      console.log(`  ${fromVal} → ${toVal} : ${result.count} quiz mis à jour`);
    }
  }

  const summary = await prisma.quiz.groupBy({
    by: ['difficulty'],
    _count: { id: true },
    orderBy: { difficulty: 'asc' },
  });

  console.log('\nRésumé des difficultés en base :');
  summary.forEach((s) => {
    console.log(`  - ${s.difficulty || '(vide)'}: ${s._count.id} quiz`);
  });

  await prisma.$disconnect();
  console.log('\nTerminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
