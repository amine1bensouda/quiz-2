/**
 * Script de diagnostic pour l'erreur Internal Server Error dans l'admin
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function diagnose() {
  console.log('🔍 Diagnostic de l\'erreur admin\n');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. Vérifier DATABASE_URL
    console.log('1️⃣ Vérification de DATABASE_URL...');
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL non défini');
      return;
    }
    console.log('✅ DATABASE_URL défini');
    console.log(`   Format: ${dbUrl.includes('pooler') ? 'Session Pooler' : 'Connexion directe'}`);
    console.log(`   Port: ${dbUrl.match(/:(\d+)\//)?.[1] || 'non trouvé'}`);
    console.log('');

    // 2. Tester la connexion
    console.log('2️⃣ Test de connexion...');
    await prisma.$connect();
    console.log('✅ Connexion réussie');
    console.log('');

    // 3. Tester les requêtes individuelles
    console.log('3️⃣ Test des requêtes Prisma...');
    
    try {
      const quizCount = await prisma.quiz.count();
      console.log(`✅ prisma.quiz.count(): ${quizCount}`);
    } catch (error: any) {
      console.error(`❌ Erreur prisma.quiz.count(): ${error.message}`);
    }

    try {
      const questionCount = await prisma.question.count();
      console.log(`✅ prisma.question.count(): ${questionCount}`);
    } catch (error: any) {
      console.error(`❌ Erreur prisma.question.count(): ${error.message}`);
    }

    try {
      const moduleCount = await prisma.module.count();
      console.log(`✅ prisma.module.count(): ${moduleCount}`);
    } catch (error: any) {
      console.error(`❌ Erreur prisma.module.count(): ${error.message}`);
    }

    console.log('');

    // 4. Tester getAllQuiz
    console.log('4️⃣ Test de getAllQuiz...');
    try {
      const { getAllQuiz } = await import('../src/lib/quiz-service');
      const quizzes = await getAllQuiz();
      console.log(`✅ getAllQuiz(): ${quizzes.length} quiz récupérés`);
    } catch (error: any) {
      console.error(`❌ Erreur getAllQuiz(): ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }

    console.log('');

    // 5. Vérifier les cours publiés
    console.log('5️⃣ Vérification des cours publiés...');
    try {
      const publishedCourses = await prisma.course.count({
        where: { status: 'published' },
      });
      console.log(`✅ Cours publiés: ${publishedCourses}`);
      
      const draftCourses = await prisma.course.count({
        where: { status: 'draft' },
      });
      console.log(`   Cours en brouillon: ${draftCourses}`);
    } catch (error: any) {
      console.error(`❌ Erreur: ${error.message}`);
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ Diagnostic terminé');

  } catch (error: any) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
