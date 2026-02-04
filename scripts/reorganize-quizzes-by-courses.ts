/**
 * Script pour réorganiser les quiz et les associer aux bons cours
 * Déplace les quiz du cours "Tous les Quiz" vers les cours appropriés
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

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * Détermine à quel cours appartient un quiz basé sur son titre/slug
 */
function determineCourseForQuiz(quizTitle: string, quizSlug: string): string | null {
  const title = quizTitle.toLowerCase();
  const slug = quizSlug.toLowerCase();
  
  // ACT QBank - La plupart des quiz ACT
  if (
    title.includes('exam') ||
    title.includes('mini exam') ||
    title.includes('quiz') ||
    title.includes('numbers') ||
    title.includes('operations') ||
    title.includes('fractions') ||
    title.includes('factors') ||
    title.includes('factorization') ||
    title.includes('simplification') ||
    title.includes('averages') ||
    title.includes('percentages') ||
    title.includes('rates') ||
    title.includes('ratios') ||
    title.includes('equations') ||
    title.includes('inequalities') ||
    title.includes('quadratics') ||
    title.includes('sequences') ||
    title.includes('lines') ||
    title.includes('functions') ||
    title.includes('logarithm') ||
    title.includes('area') ||
    title.includes('volume') ||
    title.includes('probability') ||
    title.includes('statistics') ||
    title.includes('transformations') ||
    title.includes('circles') ||
    title.includes('ellipses') ||
    title.includes('geometry') ||
    title.includes('trigonometry') ||
    title.includes('angles') ||
    title.includes('distances') ||
    title.includes('system') ||
    title.includes('algebraic') ||
    title.includes('polynomial') ||
    title.includes('rational') ||
    title.includes('exponential') ||
    slug.includes('exam') ||
    slug.includes('mini-exam') ||
    slug.includes('quiz') ||
    slug.includes('factorization') ||
    slug.includes('simplification')
  ) {
    return 'act-qbank';
  }
  
  // SAT QBank
  if (title.includes('sat') || slug.includes('sat')) {
    return 'sat-qbank';
  }
  
  // PSAT/MMSQT Math QBank
  if (title.includes('psat') || title.includes('nmsqt') || slug.includes('psat') || slug.includes('nmsqt')) {
    return 'psat-nmsqt-math-qbank';
  }
  
  // The ACT Math Fundamentals
  if (title.includes('fundamental') || slug.includes('fundamental')) {
    return 'act-math-fundamentals';
  }
  
  return null;
}

async function reorganizeQuizzes() {
  console.log('🔄 Réorganisation des quiz par cours\n');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // 1. Récupérer le cours "Tous les Quiz"
    const allQuizzesCourse = await prisma.course.findFirst({
      where: { slug: 'all-quizzes' },
      include: {
        modules: {
          include: {
            quizzes: true,
          },
        },
      },
    });
    
    if (!allQuizzesCourse) {
      console.log('⚠️  Le cours "Tous les Quiz" n\'existe pas');
      return;
    }
    
    // 2. Récupérer tous les cours cibles
    const targetCourses = await prisma.course.findMany({
      where: {
        slug: {
          in: ['act-qbank', 'sat-qbank', 'psat-nmsqt-math-qbank', 'act-math-fundamentals'],
        },
      },
      include: {
        modules: true,
      },
    });
    
    const courseMap = new Map<string, any>();
    targetCourses.forEach((course) => {
      courseMap.set(course.slug, course);
    });
    
    console.log(`📚 ${targetCourses.length} cours cibles trouvés\n`);
    
    // 3. Parcourir tous les quiz du cours "Tous les Quiz"
    let totalMoved = 0;
    
    for (const module of allQuizzesCourse.modules) {
      console.log(`\n📦 Module: ${module.title} (${module.quizzes.length} quiz)`);
      
      for (const quiz of module.quizzes) {
        const targetCourseSlug = determineCourseForQuiz(quiz.title, quiz.slug);
        
        if (targetCourseSlug && courseMap.has(targetCourseSlug)) {
          const targetCourse = courseMap.get(targetCourseSlug);
          
          // Trouver ou créer un module dans le cours cible
          let targetModule = targetCourse.modules.find((m: any) => m.slug.includes('quiz'));
          
          if (!targetModule && targetCourse.modules.length > 0) {
            targetModule = targetCourse.modules[0];
          }
          
          if (targetModule) {
            // Déplacer le quiz
            await prisma.quiz.update({
              where: { id: quiz.id },
              data: { moduleId: targetModule.id },
            });
            
            console.log(`  ✅ "${quiz.title}" → ${targetCourse.title}`);
            totalMoved++;
          }
        }
      }
    }
    
    // 4. Statistiques finales
    const finalCourses = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            _count: {
              select: { quizzes: true },
            },
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Résumé de la réorganisation:');
    console.log(`  ✅ Quiz déplacés: ${totalMoved}`);
    
    console.log('\n📚 État final des cours:');
    for (const course of finalCourses) {
      const totalQuizzes = course.modules.reduce(
        (sum, module) => sum + module._count.quizzes,
        0
      );
      if (totalQuizzes > 0 || course.slug !== 'all-quizzes') {
        console.log(`  - ${course.title}: ${totalQuizzes} quiz dans ${course.modules.length} module(s)`);
      }
    }
    
    console.log('\n✅ Réorganisation terminée avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

reorganizeQuizzes()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
