/**
 * Script pour vérifier les données dans PostgreSQL (Supabase)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function checkData() {
  console.log('📊 Vérification des données dans PostgreSQL (Supabase)\n');
  console.log('='.repeat(70));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connexion PostgreSQL réussie\n');

    // Compter les données
    const coursesCount = await prisma.course.count();
    const modulesCount = await prisma.module.count();
    const quizzesCount = await prisma.quiz.count();
    const questionsCount = await prisma.question.count();
    const answersCount = await prisma.answer.count();
    const usersCount = await prisma.user.count();
    const quizAttemptsCount = await prisma.quizAttempt.count();

    console.log('📊 Statistiques de la base de données:');
    console.log(`  ✅ Cours: ${coursesCount}`);
    console.log(`  ✅ Modules: ${modulesCount}`);
    console.log(`  ✅ Quiz: ${quizzesCount}`);
    console.log(`  ✅ Questions: ${questionsCount}`);
    console.log(`  ✅ Réponses: ${answersCount}`);
    console.log(`  ✅ Utilisateurs: ${usersCount}`);
    console.log(`  ✅ Tentatives de quiz: ${quizAttemptsCount}\n`);

    // Afficher quelques exemples
    console.log('📚 Exemples de cours:');
    const courses = await prisma.course.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        _count: {
          select: { modules: true },
        },
      },
    });

    for (const course of courses) {
      const moduleCount = await prisma.module.count({
        where: { courseId: course.id },
      });
      const quizCount = await prisma.quiz.count({
        where: { module: { courseId: course.id } },
      });
      console.log(`  - ${course.title} (${course.status})`);
      console.log(`    Modules: ${moduleCount}, Quiz: ${quizCount}`);
    }

    console.log('\n✅ Toutes les données sont présentes dans Supabase !');
    console.log('💡 Vous pouvez maintenant utiliser votre application avec PostgreSQL');

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkData()
  .then(() => {
    console.log('\n🎉 Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
