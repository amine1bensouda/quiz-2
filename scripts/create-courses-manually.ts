/**
 * Script pour créer manuellement les cours identifiés dans WordPress
 * et associer les quiz existants
 * 
 * Cours identifiés depuis l'interface admin:
 * 1. PSAT/MMSQT Math QBank - 12 quiz
 * 2. SAT QBank - 125 quiz
 * 3. The ACT Math Fundamentals - 0 quiz
 * 4. New Course - 0 quiz
 * 5. ACT QBank - 138 quiz
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Corriger DATABASE_URL pour SQLite
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

interface CourseConfig {
  title: string;
  slug: string;
  description?: string;
  modules?: {
    title: string;
    slug: string;
    description?: string;
    quizKeywords?: string[]; // Mots-clés pour trouver les quiz associés
  }[];
}

// Configuration des cours basée sur l'interface WordPress
const coursesConfig: CourseConfig[] = [
  {
    title: 'PSAT/MMSQT Math QBank',
    slug: 'psat-nmsqt-math-qbank',
    description: 'PSAT/NMSQT Mathematics Question Bank',
    modules: [
      {
        title: 'PSAT/NMSQT Quizzes',
        slug: 'psat-quizzes',
        description: 'All PSAT/NMSQT Math quizzes',
        quizKeywords: ['psat', 'nmsqt'],
      },
    ],
  },
  {
    title: 'SAT QBank',
    slug: 'sat-qbank',
    description: 'SAT Mathematics Question Bank',
    modules: [
      {
        title: 'SAT Quizzes',
        slug: 'sat-quizzes',
        description: 'All SAT Math quizzes',
        quizKeywords: ['sat'],
      },
    ],
  },
  {
    title: 'The ACT Math Fundamentals',
    slug: 'act-math-fundamentals',
    description: 'ACT Mathematics Fundamentals Course',
    modules: [
      {
        title: 'Fundamentals',
        slug: 'fundamentals',
        description: 'Fundamental ACT Math concepts',
        quizKeywords: ['fundamental', 'fundamentals'],
      },
    ],
  },
  {
    title: 'New Course',
    slug: 'new-course',
    description: 'New Course',
    modules: [],
  },
  {
    title: 'ACT QBank',
    slug: 'act-qbank',
    description: 'ACT Mathematics Question Bank',
    modules: [
      {
        title: 'ACT Math Quizzes',
        slug: 'act-math-quizzes',
        description: 'All ACT Math quizzes',
        quizKeywords: ['exam', 'mini-exam', 'quiz', 'numbers', 'operations', 'fractions', 'factors', 'averages', 'percentages', 'rates', 'ratios', 'equations', 'inequalities', 'quadratics', 'sequences', 'lines', 'functions', 'logarithm', 'area', 'volume', 'probability', 'statistics', 'transformations', 'circles', 'ellipses', 'geometry', 'trigonometry', 'angles', 'distances', 'system', 'algebraic', 'polynomial', 'rational', 'exponential'],
      },
    ],
  },
];

/**
 * Trouve les quiz qui correspondent aux mots-clés
 */
function findQuizzesByKeywords(quizzes: any[], keywords: string[]): any[] {
  return quizzes.filter((quiz) => {
    const title = (quiz.title || '').toLowerCase();
    const slug = (quiz.slug || '').toLowerCase();
    
    return keywords.some((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      return title.includes(lowerKeyword) || slug.includes(lowerKeyword);
    });
  });
}

/**
 * Fonction principale
 */
async function createCoursesManually() {
  console.log('🚀 Création manuelle des cours\n');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // 1. Récupérer tous les quiz existants
    console.log('📝 Récupération des quiz existants...');
    const existingQuizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        moduleId: true,
      },
    });
    
    console.log(`✅ ${existingQuizzes.length} quiz trouvés dans la base de données\n`);
    
    // 2. Créer chaque cours
    let totalQuizzesAssigned = 0;
    
    for (const courseConfig of coursesConfig) {
      console.log(`\n📚 Création du cours: ${courseConfig.title}`);
      
      // Créer ou récupérer le cours
      let course = await prisma.course.findFirst({
        where: { slug: courseConfig.slug },
      });
      
      if (!course) {
        course = await prisma.course.create({
          data: {
            title: courseConfig.title,
            slug: courseConfig.slug,
            description: courseConfig.description || null,
          },
        });
        console.log(`  ✅ Cours créé: ${course.title}`);
      } else {
        // Mettre à jour le titre si nécessaire
        if (course.title !== courseConfig.title) {
          course = await prisma.course.update({
            where: { id: course.id },
            data: { title: courseConfig.title },
          });
          console.log(`  🔄 Cours mis à jour: ${course.title}`);
        } else {
          console.log(`  ℹ️  Cours existant: ${course.title}`);
        }
      }
      
      // 3. Créer les modules
      if (courseConfig.modules && courseConfig.modules.length > 0) {
        for (let i = 0; i < courseConfig.modules.length; i++) {
          const moduleConfig = courseConfig.modules[i];
          
          let module = await prisma.module.findFirst({
            where: {
              courseId: course.id,
              slug: moduleConfig.slug,
            },
          });
          
          if (!module) {
            module = await prisma.module.create({
              data: {
                courseId: course.id,
                title: moduleConfig.title,
                slug: moduleConfig.slug,
                description: moduleConfig.description || null,
                order: i,
              },
            });
            console.log(`    ✅ Module créé: ${module.title}`);
          } else {
            console.log(`    ℹ️  Module existant: ${module.title}`);
          }
          
          // 4. Associer les quiz au module
          if (moduleConfig.quizKeywords && moduleConfig.quizKeywords.length > 0) {
            const matchingQuizzes = findQuizzesByKeywords(
              existingQuizzes,
              moduleConfig.quizKeywords
            );
            
            // Filtrer les quiz qui ne sont pas déjà associés à un autre module de ce cours
            const availableQuizzes = matchingQuizzes.filter((q) => {
              // Si le quiz n'a pas de module, ou si son module n'appartient pas à ce cours
              if (!q.moduleId) return true;
              
              // Vérifier si le module appartient à ce cours
              return false; // On ne déplace pas les quiz déjà associés
            });
            
            // Associer les quiz non associés
            const unassignedQuizzes = availableQuizzes.filter((q) => !q.moduleId);
            
            if (unassignedQuizzes.length > 0) {
              console.log(`      📝 ${unassignedQuizzes.length} quiz trouvés pour ce module`);
              
              for (const quiz of unassignedQuizzes) {
                await prisma.quiz.update({
                  where: { id: quiz.id },
                  data: { moduleId: module.id },
                });
                totalQuizzesAssigned++;
              }
              
              console.log(`      ✅ ${unassignedQuizzes.length} quiz associés au module`);
            } else {
              console.log(`      ℹ️  Aucun quiz disponible pour ce module`);
            }
          }
        }
      }
    }
    
    // 5. Statistiques finales
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            _count: {
              select: { quizzes: true },
            },
          },
        },
      },
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Résumé:');
    console.log(`  ✅ Cours créés/mis à jour: ${coursesConfig.length}`);
    console.log(`  ✅ Quiz associés: ${totalQuizzesAssigned}`);
    
    console.log('\n📚 Détail des cours:');
    for (const course of courses) {
      const totalQuizzes = course.modules.reduce(
        (sum, module) => sum + module._count.quizzes,
        0
      );
      console.log(`  - ${course.title}: ${totalQuizzes} quiz dans ${course.modules.length} module(s)`);
    }
    
    console.log('\n✅ Création terminée avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter
createCoursesManually()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
