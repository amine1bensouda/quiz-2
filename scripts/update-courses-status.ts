/**
 * Script pour mettre à jour le statut des cours existants
 * Définit tous les cours existants comme "published" par défaut
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

if (process.env.DATABASE_URL) {
  let dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (!dbPath.startsWith('/') && !dbPath.match(/^[A-Z]:/)) {
    dbPath = resolve(process.cwd(), dbPath);
  }
  process.env.DATABASE_URL = `file:${dbPath}`;
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    // Mettre à jour tous les cours pour qu'ils soient publiés par défaut
    const result = await prisma.course.updateMany({
      data: {
        status: 'published',
      },
    });

    console.log(`✅ ${result.count} cours mis à jour avec le statut "published"`);

    // Afficher le résumé
    const courses = await prisma.course.findMany({
      select: {
        title: true,
        status: true,
      },
    });

    console.log('\n📊 Résumé des statuts:');
    const published = courses.filter((c) => c.status === 'published').length;
    const draft = courses.filter((c) => c.status === 'draft').length;
    console.log(`  - Publiés: ${published}`);
    console.log(`  - Brouillons: ${draft}`);
    console.log(`  - Total: ${courses.length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
