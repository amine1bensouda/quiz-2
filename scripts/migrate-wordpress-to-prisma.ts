/**
 * Script de migration WordPress → SQLite/PostgreSQL (Prisma)
 * 
 * Usage:
 * 1. Configurer DATABASE_URL dans .env.local
 * 2. Exécuter: npx tsx scripts/migrate-wordpress-to-prisma.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local explicitement
config({ path: resolve(process.cwd(), '.env.local') });

// Corriger DATABASE_URL pour SQLite (garder "file:" mais utiliser chemin absolu)
if (process.env.DATABASE_URL) {
  let dbPath = process.env.DATABASE_URL.replace(/^file:/, '');
  // Si c'est un chemin relatif, le convertir en absolu
  if (!dbPath.startsWith('/') && !dbPath.match(/^[A-Z]:/)) {
    dbPath = resolve(process.cwd(), dbPath);
  }
  process.env.DATABASE_URL = `file:${dbPath}`;
}

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// Prisma 6 fonctionne directement avec SQLite
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost/test2';

const tutorApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/tutor/v1`,
  timeout: 30000,
});

interface WordPressQuiz {
  ID: number;
  id: number;
  post_title: string;
  post_name: string;
  slug: string;
  post_content: string;
  post_excerpt: string;
  featured_image_id?: number;
  featured_image_url?: string;
  duration?: number;
  difficulty?: string;
  passing_grade?: number;
  randomize_questions?: boolean;
  question_count?: number;
}

async function migrateQuizzes() {
  console.log('🚀 Début de la migration WordPress → PostgreSQL\n');

  try {
    // 1. Récupérer tous les quiz depuis WordPress
    console.log('📥 Récupération des quiz depuis WordPress...');
    const response = await tutorApiClient.get('/quizzes', {
      params: { per_page: 100 },
    });

    const quizzesData: WordPressQuiz[] = response.data?.data || response.data || [];
    console.log(`✅ ${quizzesData.length} quiz récupérés\n`);

    // 2. Créer un cours par défaut
    console.log('📚 Création du cours par défaut...');
    let defaultCourse = await prisma.course.findFirst({
      where: { slug: 'act-math' },
    });

    if (!defaultCourse) {
      defaultCourse = await prisma.course.create({
        data: {
          title: 'ACT Math',
          slug: 'act-math',
          description: 'ACT Mathematics Course',
        },
      });
      console.log(`✅ Cours créé: ${defaultCourse.title}\n`);
    } else {
      console.log(`✅ Cours existant: ${defaultCourse.title}\n`);
    }

    // 3. Créer les modules depuis la structure existante
    const { ACT_MATH_COURSE } = await import('../src/lib/course-structure');
    const moduleMap = new Map<string, string>(); // slug → moduleId

    console.log('📦 Création des modules...');
    for (let i = 0; i < ACT_MATH_COURSE.modules.length; i++) {
      const module = ACT_MATH_COURSE.modules[i];
      let dbModule = await prisma.module.findFirst({
        where: {
          courseId: defaultCourse.id,
          slug: module.id,
        },
      });

      if (!dbModule) {
        dbModule = await prisma.module.create({
          data: {
            courseId: defaultCourse.id,
            title: module.title,
            slug: module.id,
            description: module.description || null,
            order: i,
          },
        });
        console.log(`  ✅ Module créé: ${module.title}`);
      } else {
        console.log(`  ℹ️  Module existant: ${module.title}`);
      }

      moduleMap.set(module.id, dbModule.id);
    }
    console.log('');

    // 4. Migrer chaque quiz
    console.log('🔄 Migration des quiz...\n');
    let successCount = 0;
    let errorCount = 0;

    for (const wpQuiz of quizzesData) {
      try {
        // Vérifier si le quiz existe déjà
        const existingQuiz = await prisma.quiz.findUnique({
          where: { slug: wpQuiz.post_name || wpQuiz.slug },
        });

        if (existingQuiz) {
          console.log(`  ⏭️  Quiz déjà existant: ${wpQuiz.post_title}`);
          continue;
        }

        // Trouver le module correspondant
        let moduleId: string | null = null;
        for (const [moduleSlug, moduleDbId] of moduleMap.entries()) {
          const module = ACT_MATH_COURSE.modules.find((m) => m.id === moduleSlug);
          if (module?.quizSlugs.includes(wpQuiz.post_name || wpQuiz.slug)) {
            moduleId = moduleDbId;
            break;
          }
        }

        // Récupérer les questions du quiz
        const quizId = wpQuiz.ID || wpQuiz.id;
        let questions: any[] = [];

        try {
          const questionsResponse = await tutorApiClient.get('/questions', {
            params: { quiz_id: quizId },
          });

          const questionsData = questionsResponse.data?.data || questionsResponse.data || [];
          questions = Array.isArray(questionsData) ? questionsData : [];
        } catch (error) {
          console.warn(`  ⚠️  Impossible de récupérer les questions pour ${wpQuiz.post_title}`);
        }

        // Créer le quiz
        const quiz = await prisma.quiz.create({
          data: {
            title: wpQuiz.post_title,
            slug: wpQuiz.post_name || wpQuiz.slug,
            description: wpQuiz.post_content || null,
            excerpt: wpQuiz.post_excerpt || null,
            duration: wpQuiz.duration || 10,
            difficulty: wpQuiz.difficulty || 'Moyen',
            passingGrade: wpQuiz.passing_grade || 70,
            randomizeOrder: wpQuiz.randomize_questions || false,
            maxQuestions: wpQuiz.question_count || null,
            featuredImageUrl: wpQuiz.featured_image_url || null,
            moduleId: moduleId,
            questions: {
              create: questions.map((q: any, index: number) => {
                // Extraire le texte de la question
                const questionText =
                  q.question_title ||
                  q.question ||
                  q.title ||
                  q.question_name ||
                  q.question_text ||
                  '';

                return {
                  text: questionText,
                  type: q.question_type || 'multiple_choice',
                  points: q.points || q.question_mark || 1,
                  explanation: q.answer_explanation || q.explanation || null,
                  timeLimit: q.time_limit || null,
                  order: index,
                  answers: {
                    create: (q.answers || []).map((a: any, aIndex: number) => ({
                      text: a.answer_title || a.answer || a.text || a.answer_text || '',
                      isCorrect:
                        a.is_correct === true ||
                        a.is_correct === 1 ||
                        a.is_correct === 'yes' ||
                        a.correct === true ||
                        a.correct === 1,
                      explanation: a.answer_explanation || a.explanation || null,
                      order: aIndex,
                    })),
                  },
                };
              }),
            },
          },
        });

        console.log(`  ✅ Quiz migré: ${quiz.title} (${questions.length} questions)`);
        successCount++;
      } catch (error: any) {
        console.error(`  ❌ Erreur migration ${wpQuiz.post_title}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`  ✅ Succès: ${successCount}`);
    console.log(`  ❌ Erreurs: ${errorCount}`);
    console.log(`  📝 Total: ${quizzesData.length}`);

    console.log('\n✅ Migration terminée !');
  } catch (error) {
    console.error('\n❌ Erreur fatale lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateQuizzes()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
