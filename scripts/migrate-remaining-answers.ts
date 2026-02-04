/**
 * Script pour migrer les réponses restantes depuis SQLite vers PostgreSQL
 * Ce script reprend la migration là où elle s'est arrêtée
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const sqlitePath = resolve(process.cwd(), 'prisma/dev.db');
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error('❌ DATABASE_URL non défini dans .env.local');
  process.exit(1);
}

// Connexion SQLite
const sqliteDb = new Database(sqlitePath, { readonly: true });

// Client PostgreSQL
const postgresPrisma = new PrismaClient();

async function migrateRemainingAnswers() {
  console.log('🔄 Migration des réponses restantes...\n');

  try {
    await postgresPrisma.$connect();
    console.log('✅ Connexion PostgreSQL réussie\n');

    // Récupérer toutes les réponses depuis SQLite
    const sqliteAnswers = sqliteDb.prepare('SELECT * FROM answers ORDER BY createdAt ASC').all() as any[];
    console.log(`📊 ${sqliteAnswers.length} réponses à migrer\n`);

    // Récupérer les réponses déjà migrées depuis PostgreSQL
    const existingAnswers = await postgresPrisma.answer.findMany({
      select: { id: true },
    });
    const existingIds = new Set(existingAnswers.map(a => a.id));

    console.log(`📊 ${existingIds.size} réponses déjà migrées\n`);

    let answersMigrated = 0;
    let answersSkipped = 0;
    let errors = 0;

    // Migrer par lots de 100 pour éviter les timeouts
    const batchSize = 100;
    for (let i = 0; i < sqliteAnswers.length; i += batchSize) {
      const batch = sqliteAnswers.slice(i, i + batchSize);
      console.log(`📦 Traitement du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(sqliteAnswers.length / batchSize)}...`);

      for (const answer of batch) {
        try {
          // Vérifier si déjà migré
          if (existingIds.has(answer.id)) {
            answersSkipped++;
            continue;
          }

          // Vérifier que la question existe
          const questionExists = await postgresPrisma.question.findUnique({
            where: { id: answer.questionId },
          });

          if (!questionExists) {
            console.log(`  ⚠️  Question ${answer.questionId} non trouvée, réponse ignorée`);
            continue;
          }

          await postgresPrisma.answer.create({
            data: {
              id: answer.id,
              questionId: answer.questionId,
              text: answer.text,
              isCorrect: Boolean(answer.isCorrect),
              explanation: answer.explanation,
              order: answer.order,
              createdAt: new Date(answer.createdAt),
              updatedAt: new Date(answer.updatedAt),
            },
          });

          answersMigrated++;
          existingIds.add(answer.id); // Ajouter à la liste pour éviter les doublons

          if (answersMigrated % 50 === 0) {
            console.log(`  ✅ ${answersMigrated} réponses migrées...`);
          }
        } catch (error: any) {
          errors++;
          if (errors <= 10) {
            console.error(`  ❌ Erreur pour réponse ${answer.id}: ${error.message}`);
          }
        }
      }

      // Petite pause entre les lots pour éviter les timeouts
      if (i + batchSize < sqliteAnswers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Résumé de la migration des réponses:');
    console.log(`  ✅ Réponses migrées: ${answersMigrated}`);
    console.log(`  ⏭️  Réponses déjà existantes: ${answersSkipped}`);
    console.log(`  ❌ Erreurs: ${errors}`);
    console.log(`  📝 Total traité: ${sqliteAnswers.length}`);
    console.log('\n✅ Migration terminée !');

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await postgresPrisma.$disconnect();
  }
}

// Exécuter la migration
migrateRemainingAnswers()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
