import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env.local') });

// Corriger DATABASE_URL pour SQLite
if (process.env.DATABASE_URL) {
  let dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  if (!dbPath.startsWith('/') && !dbPath.match(/^[A-Z]:/)) {
    dbPath = resolve(process.cwd(), dbPath);
  }
  process.env.DATABASE_URL = `file:${dbPath}`;
}

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function debugQuiz() {
  try {
    console.log('🔍 Vérification de la connexion...');
    await prisma.$connect();
    console.log('✅ Connexion réussie\n');

    console.log('📊 Comptage des quiz...');
    const count = await prisma.quiz.count();
    console.log(`   Nombre de quiz: ${count}\n`);

    if (count > 0) {
      console.log('📝 Récupération des 3 premiers quiz...');
      const quizzes = await prisma.quiz.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          module: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      });

      console.log('   Quiz trouvés:');
      quizzes.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.title} (slug: ${q.slug})`);
        console.log(`      Module: ${q.module?.title || 'Aucun'}`);
      });

      console.log('\n🔍 Test avec include complet...');
      const fullQuiz = await prisma.quiz.findFirst({
        include: {
          module: {
            include: {
              course: true,
            },
          },
          questions: {
            include: {
              answers: true,
            },
            take: 2,
          },
        },
      });

      if (fullQuiz) {
        console.log(`   Quiz complet: ${fullQuiz.title}`);
        console.log(`   Questions: ${fullQuiz.questions.length}`);
        console.log(`   Module: ${fullQuiz.module?.title || 'Aucun'}`);
      }
    } else {
      console.log('⚠️ Aucun quiz trouvé dans la base de données!');
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuiz();
