/**
 * Script pour importer les cours depuis WordPress
 * Basé sur la structure visible dans l'interface admin WordPress
 * 
 * Cours identifiés:
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

// Vérifier que DATABASE_URL est configuré pour PostgreSQL
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('❌ DATABASE_URL doit pointer vers PostgreSQL (Supabase)');
  console.error('💡 Vérifiez votre fichier .env.local');
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost/test2';

const tutorApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/tutor/v1`,
  timeout: 30000,
});

const wpApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/wp/v2`,
  timeout: 30000,
});

/**
 * Tente de récupérer les cours via différentes méthodes
 */
async function getCoursesFromWordPress() {
  console.log('📚 Recherche des cours dans WordPress...\n');
  
  const methods = [
    // Méthode 1: Via l'API WordPress standard avec post_type
    {
      name: 'WordPress /posts (post_type=tutor_course)',
      fn: async () => {
        const response = await wpApiClient.get('/posts', {
          params: {
            per_page: 100,
            type: 'tutor_course',
            status: 'any',
          },
        });
        return Array.isArray(response.data) ? response.data : [];
      },
    },
    // Méthode 2: Via l'endpoint tutor_course directement
    {
      name: 'WordPress /tutor_course',
      fn: async () => {
        try {
          const response = await wpApiClient.get('/tutor_course', {
            params: {
              per_page: 100,
              status: 'publish',
            },
          });
          return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
          if (error.response?.status === 404) {
            // Essayer avec l'endpoint personnalisé
            return [];
          }
          throw error;
        }
      },
    },
    // Méthode 3: Via l'API Tutor LMS
    {
      name: 'Tutor LMS /courses',
      fn: async () => {
        try {
          const response = await tutorApiClient.get('/courses', {
            params: { per_page: 100 },
          });
          return response.data?.data || response.data || [];
        } catch (error) {
          return [];
        }
      },
    },
  ];

  for (const method of methods) {
    try {
      console.log(`  🔍 Essai: ${method.name}...`);
      const courses = await method.fn();
      
      if (Array.isArray(courses) && courses.length > 0) {
        console.log(`  ✅ ${courses.length} cours trouvés via ${method.name}\n`);
        return courses;
      }
    } catch (error: any) {
      console.log(`  ⚠️  ${method.name} non disponible: ${error.response?.status || error.message}`);
    }
  }

  console.log('  ⚠️  Aucun cours trouvé via l\'API\n');
  return [];
}

/**
 * Récupère les topics/modules d'un cours
 */
async function getCourseTopics(courseId: number) {
  try {
    const response = await tutorApiClient.get('/topics', {
      params: {
        course_id: courseId,
        per_page: 100,
      },
    });
    
    const topicsData = response.data?.data || response.data || [];
    return Array.isArray(topicsData) ? topicsData : [];
  } catch (error: any) {
    // Essayer via l'API WordPress standard
    try {
      const response = await wpApiClient.get('/posts', {
        params: {
          per_page: 100,
          type: 'tutor_topic',
          meta_key: 'tutor_course_id',
          meta_value: courseId,
        },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error2) {
      return [];
    }
  }
}

/**
 * Récupère les quiz d'un cours
 */
async function getQuizzesForCourse(courseId: number) {
  try {
    // Essayer plusieurs méthodes
    const methods = [
      // Méthode 1: Via Tutor LMS API avec course_id
      {
        name: 'Tutor LMS /quizzes (course_id)',
        fn: async () => {
          const response = await tutorApiClient.get('/quizzes', {
            params: {
              course_id: courseId,
              per_page: 200,
            },
          });
          return response.data?.data || response.data || [];
        },
      },
      // Méthode 2: Récupérer tous les quiz et filtrer par meta
      {
        name: 'Tutor LMS /quizzes (tous)',
        fn: async () => {
          const response = await tutorApiClient.get('/quizzes', {
            params: { per_page: 200 },
          });
          const allQuizzes = response.data?.data || response.data || [];
          // Filtrer par course_id si disponible dans les meta
          return Array.isArray(allQuizzes) ? allQuizzes : [];
        },
      },
    ];

    for (const method of methods) {
      try {
        const quizzes = await method.fn();
        if (Array.isArray(quizzes) && quizzes.length > 0) {
          return quizzes;
        }
      } catch (error) {
        // Continuer avec la méthode suivante
      }
    }

    return [];
  } catch (error: any) {
    console.warn(`  ⚠️  Impossible de récupérer les quiz pour le cours ${courseId}`);
    return [];
  }
}

/**
 * Récupère les questions d'un quiz
 */
async function getQuizQuestions(quizId: number) {
  try {
    const response = await tutorApiClient.get('/questions', {
      params: { quiz_id: quizId },
    });
    
    const questionsData = response.data?.data || response.data || [];
    return Array.isArray(questionsData) ? questionsData : [];
  } catch (error: any) {
    return [];
  }
}

/**
 * Crée ou récupère un cours dans Prisma
 */
async function getOrCreateCourse(wpCourse: any) {
  const title = wpCourse.post_title || wpCourse.title || wpCourse.name || 'Sans titre';
  const slug = wpCourse.post_name || wpCourse.slug || `course-${wpCourse.ID || wpCourse.id}`;
  
  let course = await prisma.course.findFirst({
    where: { slug },
  });
  
  if (!course) {
    course = await prisma.course.create({
      data: {
        title,
        slug,
        description: wpCourse.post_content || wpCourse.content || wpCourse.description || null,
      },
    });
    console.log(`    ✅ Cours créé: ${course.title}`);
  } else {
    console.log(`    ℹ️  Cours existant: ${course.title}`);
  }
  
  return course;
}

/**
 * Crée ou récupère un module dans Prisma
 */
async function getOrCreateModule(courseId: string, wpTopic: any, order: number) {
  const title = wpTopic.post_title || wpTopic.title || `Module ${order + 1}`;
  const slug = wpTopic.post_name || wpTopic.slug || `module-${wpTopic.ID || wpTopic.id || order}`;
  
  let module = await prisma.module.findFirst({
    where: {
      courseId,
      slug,
    },
  });
  
  if (!module) {
    module = await prisma.module.create({
      data: {
        courseId,
        title,
        slug,
        description: wpTopic.post_content || wpTopic.content || null,
        order,
      },
    });
    console.log(`      ✅ Module créé: ${module.title}`);
  } else {
    console.log(`      ℹ️  Module existant: ${module.title}`);
  }
  
  return module;
}

/**
 * Importe un quiz dans Prisma
 */
async function importQuiz(wpQuiz: any, moduleId: string | null) {
  const slug = wpQuiz.post_name || wpQuiz.slug || `quiz-${wpQuiz.ID || wpQuiz.id}`;
  
  // Vérifier si le quiz existe déjà
  const existingQuiz = await prisma.quiz.findUnique({
    where: { slug },
  });
  
  if (existingQuiz) {
    // Mettre à jour le moduleId si nécessaire
    if (moduleId && existingQuiz.moduleId !== moduleId) {
      await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: { moduleId },
      });
      console.log(`        🔄 Quiz mis à jour: ${wpQuiz.post_title || wpQuiz.title} (module associé)`);
    } else {
      console.log(`        ⏭️  Quiz déjà existant: ${wpQuiz.post_title || wpQuiz.title}`);
    }
    return existingQuiz;
  }
  
  // Récupérer les questions
  const quizId = wpQuiz.ID || wpQuiz.id;
  const questions = await getQuizQuestions(quizId);
  
  // Créer le quiz avec ses questions
  const quiz = await prisma.quiz.create({
    data: {
      title: wpQuiz.post_title || wpQuiz.title || 'Sans titre',
      slug,
      description: wpQuiz.post_content || wpQuiz.content || null,
      excerpt: wpQuiz.post_excerpt || wpQuiz.excerpt || null,
      duration: wpQuiz.duration || wpQuiz.time_limit || 10,
      difficulty: wpQuiz.difficulty || 'Moyen',
      passingGrade: wpQuiz.passing_grade || 70,
      randomizeOrder: wpQuiz.randomize_questions || false,
      maxQuestions: wpQuiz.question_count || null,
      featuredImageUrl: wpQuiz.featured_image_url || null,
      moduleId: moduleId,
      questions: {
        create: questions.map((q: any, index: number) => {
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
  
  console.log(`        ✅ Quiz importé: ${quiz.title} (${questions.length} questions)`);
  return quiz;
}

/**
 * Fonction principale
 */
async function importCourses() {
  console.log('🚀 Import des cours depuis WordPress\n');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // 1. Récupérer tous les cours
    const wpCourses = await getCoursesFromWordPress();
    
    if (wpCourses.length === 0) {
      console.log('⚠️  Aucun cours trouvé dans WordPress');
      console.log('💡 Les cours existent peut-être mais ne sont pas exposés via l\'API REST');
      console.log('💡 Solution: Modifier le plugin WordPress pour exposer les cours\n');
      return;
    }
    
    console.log(`📊 ${wpCourses.length} cours à traiter\n`);
    
    let totalQuizzes = 0;
    let totalQuestions = 0;
    
    // 2. Pour chaque cours
    for (const wpCourse of wpCourses) {
      const courseTitle = wpCourse.post_title || wpCourse.title || 'Sans titre';
      const courseId = wpCourse.ID || wpCourse.id;
      
      console.log(`\n📚 Cours: ${courseTitle} (ID: ${courseId})`);
      
      // Créer ou récupérer le cours dans Prisma
      const course = await getOrCreateCourse(wpCourse);
      
      // 3. Récupérer les topics/modules du cours
      const topics = await getCourseTopics(courseId);
      
      if (topics.length > 0) {
        console.log(`   📦 ${topics.length} modules/topics trouvés`);
        
        // Créer les modules dans Prisma
        for (let i = 0; i < topics.length; i++) {
          const topic = topics[i];
          const module = await getOrCreateModule(course.id, topic, i);
          
          // 4. Récupérer les quiz du topic
          const topicId = topic.ID || topic.id;
          const quizzes = await getQuizzesForCourse(topicId);
          
          if (quizzes.length > 0) {
            console.log(`     📝 ${quizzes.length} quiz trouvés dans ce module`);
            
            for (const wpQuiz of quizzes) {
              await importQuiz(wpQuiz, module.id);
              totalQuizzes++;
              const questions = await getQuizQuestions(wpQuiz.ID || wpQuiz.id);
              totalQuestions += questions.length;
            }
          }
        }
      } else {
        // Si pas de topics, récupérer directement les quiz du cours
        console.log(`   ⚠️  Aucun module trouvé, récupération des quiz directement du cours`);
        
        const quizzes = await getQuizzesForCourse(courseId);
        
        if (quizzes.length > 0) {
          console.log(`   📝 ${quizzes.length} quiz trouvés dans ce cours`);
          
          // Créer un module par défaut
          const defaultModule = await getOrCreateModule(
            course.id,
            {
              ID: 0,
              id: 0,
              post_title: 'Quiz du cours',
              post_name: `default-${course.slug}`,
              slug: `default-${course.slug}`,
              post_content: '',
            },
            0
          );
          
          for (const wpQuiz of quizzes) {
            await importQuiz(wpQuiz, defaultModule.id);
            totalQuizzes++;
            const questions = await getQuizQuestions(wpQuiz.ID || wpQuiz.id);
            totalQuestions += questions.length;
          }
        } else {
          console.log(`   ⚠️  Aucun quiz trouvé pour ce cours`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Résumé de l\'import:');
    console.log(`  ✅ Cours traités: ${wpCourses.length}`);
    console.log(`  ✅ Quiz importés/mis à jour: ${totalQuizzes}`);
    console.log(`  ✅ Questions importées: ${totalQuestions}`);
    console.log('\n✅ Import terminé avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur fatale lors de l\'import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'import
importCourses()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
