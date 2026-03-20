/**
 * Script d'import de TOUS les cours depuis WordPress (y compris non publiés)
 * 
 * Ce script :
 * 1. Récupère tous les cours depuis Tutor LMS (publiés et non publiés)
 * 2. Pour chaque cours, récupère ses modules/topics
 * 3. Pour chaque module, récupère les quiz associés
 * 4. Importe tout dans Prisma
 * 
 * Usage:
 * 1. Configurer DATABASE_URL dans .env.local
 * 2. Exécuter: npx tsx scripts/import-all-courses.ts
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

const wpApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/wp/v2`,
  timeout: 30000,
});

interface WordPressCourse {
  ID: number;
  id: number;
  post_title: string;
  post_name: string;
  slug: string;
  post_content: string;
  post_excerpt: string;
  post_status: string;
  featured_image_id?: number;
  featured_image_url?: string;
}

interface WordPressTopic {
  ID: number;
  id: number;
  post_title: string;
  post_name: string;
  slug: string;
  post_content: string;
  course_id?: number;
  topic_id?: number;
}

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
  topic_id?: number;
  course_id?: number;
}

/**
 * Récupère tous les cours depuis WordPress (publiés et non publiés)
 */
async function getAllCourses(): Promise<WordPressCourse[]> {
  console.log('📚 Récupération de tous les cours depuis WordPress...\n');
  
  let courses: WordPressCourse[] = [];
  
  // Essayer plusieurs endpoints
  const endpoints = [
    { name: 'Tutor LMS /courses', fn: () => tutorApiClient.get('/courses', { params: { per_page: 100 } }) },
    { name: 'WordPress /tutor_course', fn: () => wpApiClient.get('/tutor_course', { params: { per_page: 100, status: 'any' } }) },
    { name: 'WordPress /courses', fn: () => wpApiClient.get('/courses', { params: { per_page: 100, status: 'any' } }) },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  🔍 Essai: ${endpoint.name}...`);
      const response = await endpoint.fn();
      
      const coursesData = response.data?.data || response.data || [];
      if (Array.isArray(coursesData) && coursesData.length > 0) {
        courses = coursesData;
        console.log(`  ✅ ${courses.length} cours trouvés via ${endpoint.name}\n`);
        break;
      }
    } catch (error: any) {
      console.log(`  ⚠️  ${endpoint.name} non disponible: ${error.message}`);
    }
  }
  
  if (courses.length === 0) {
    console.log('  ⚠️  Aucun cours trouvé via les endpoints standards');
    console.log('  💡 Le script va maintenant récupérer tous les quiz et les organiser\n');
  }
  
  return courses;
}

/**
 * Récupère les topics/modules d'un cours
 */
async function getCourseTopics(courseId: number): Promise<WordPressTopic[]> {
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
    // Si l'endpoint topics n'existe pas, essayer avec tutor_topic
    try {
      const response = await wpApiClient.get('/tutor_topic', {
        params: { 
          meta_key: 'tutor_course_id',
          meta_value: courseId,
          per_page: 100,
        },
      });
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error2: any) {
      console.warn(`  ⚠️  Impossible de récupérer les topics pour le cours ${courseId}`);
      return [];
    }
  }
}

/**
 * Récupère tous les quiz d'un cours ou topic
 */
async function getQuizzesForCourse(courseId?: number, topicId?: number): Promise<WordPressQuiz[]> {
  try {
    const params: any = { per_page: 100 };
    if (courseId) params.course_id = courseId;
    if (topicId) params.topic_id = topicId;
    
    const response = await tutorApiClient.get('/quizzes', { params });
    
    const quizzesData = response.data?.data || response.data || [];
    return Array.isArray(quizzesData) ? quizzesData : [];
  } catch (error: any) {
    console.warn(`  ⚠️  Impossible de récupérer les quiz: ${error.message}`);
    return [];
  }
}

/**
 * Récupère les questions d'un quiz
 */
async function getQuizQuestions(quizId: number): Promise<any[]> {
  try {
    const response = await tutorApiClient.get('/questions', {
      params: { quiz_id: quizId },
    });
    
    const questionsData = response.data?.data || response.data || [];
    return Array.isArray(questionsData) ? questionsData : [];
  } catch (error: any) {
    console.warn(`  ⚠️  Impossible de récupérer les questions pour le quiz ${quizId}`);
    return [];
  }
}

/**
 * Crée ou récupère un cours dans Prisma
 */
async function getOrCreateCourse(wpCourse: WordPressCourse) {
  const slug = wpCourse.post_name || wpCourse.slug || `course-${wpCourse.ID}`;
  
  let course = await prisma.course.findFirst({
    where: { slug },
  });
  
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: wpCourse.post_title,
        slug,
        description: wpCourse.post_content || wpCourse.post_excerpt || null,
      },
    });
    console.log(`    ✅ Cours créé: ${course.title}`);
  } else {
    // Mettre à jour le titre si nécessaire
    if (course.title !== wpCourse.post_title) {
      course = await prisma.course.update({
        where: { id: course.id },
        data: { title: wpCourse.post_title },
      });
      console.log(`    🔄 Cours mis à jour: ${course.title}`);
    } else {
      console.log(`    ℹ️  Cours existant: ${course.title}`);
    }
  }
  
  return course;
}

/**
 * Crée ou récupère un module dans Prisma
 */
async function getOrCreateModule(courseId: string, wpTopic: WordPressTopic, order: number) {
  const slug = wpTopic.post_name || wpTopic.slug || `module-${wpTopic.ID}`;
  
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
        title: wpTopic.post_title,
        slug,
        description: wpTopic.post_content || null,
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
async function importQuiz(wpQuiz: WordPressQuiz, moduleId: string | null) {
  const slug = wpQuiz.post_name || wpQuiz.slug || `quiz-${wpQuiz.ID}`;
  
  // Vérifier si le quiz existe déjà
  const existingQuiz = await prisma.quiz.findUnique({
    where: { slug },
  });
  
  if (existingQuiz) {
    console.log(`        ⏭️  Quiz déjà existant: ${wpQuiz.post_title}`);
    return existingQuiz;
  }
  
  // Récupérer les questions
  const quizId = wpQuiz.ID || wpQuiz.id;
  const questions = await getQuizQuestions(quizId);
  
  // Créer le quiz avec ses questions
  const quiz = await prisma.quiz.create({
    data: {
      title: wpQuiz.post_title,
      slug,
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
  
  console.log(`        ✅ Quiz importé: ${quiz.title} (${questions.length} questions)`);
  return quiz;
}

/**
 * Récupère tous les quiz depuis WordPress (tous statuts, y compris non publiés)
 */
async function getAllQuizzes(): Promise<WordPressQuiz[]> {
  console.log('📝 Récupération de tous les quiz depuis WordPress (publiés et non publiés)...\n');
  
  let allQuizzes: WordPressQuiz[] = [];
  
  // Essayer plusieurs méthodes pour récupérer tous les quiz
  const methods = [
    // Méthode 1: Tutor LMS API avec per_page=200 pour récupérer plus de quiz
    {
      name: 'Tutor LMS /quizzes (per_page=200)',
      fn: async () => {
        const response = await tutorApiClient.get('/quizzes', {
          params: { 
            per_page: 200, // Augmenter pour récupérer plus de quiz
          },
        });
        return response.data?.data || response.data || [];
      },
    },
    // Méthode 2: Tutor LMS API avec tous les statuts
    {
      name: 'Tutor LMS /quizzes (tous statuts)',
      fn: async () => {
        const response = await tutorApiClient.get('/quizzes', {
          params: { 
            per_page: 200,
            status: 'any', // Inclure tous les statuts
          },
        });
        return response.data?.data || response.data || [];
      },
    },
    // Méthode 2: WordPress API standard
    {
      name: 'WordPress /tutor_quiz (tous statuts)',
      fn: async () => {
        const response = await wpApiClient.get('/tutor_quiz', {
          params: { 
            per_page: 100,
            status: 'any', // Inclure tous les statuts
          },
        });
        return Array.isArray(response.data) ? response.data : [];
      },
    },
    // Méthode 3: Tutor LMS API sans paramètre status (par défaut)
    {
      name: 'Tutor LMS /quizzes (défaut)',
      fn: async () => {
        const response = await tutorApiClient.get('/quizzes', {
          params: { per_page: 100 },
        });
        return response.data?.data || response.data || [];
      },
    },
  ];
  
  for (const method of methods) {
    try {
      console.log(`  🔍 Essai: ${method.name}...`);
      const quizzes = await method.fn();
      
      if (Array.isArray(quizzes) && quizzes.length > 0) {
        // Fusionner avec les quiz déjà trouvés (éviter les doublons)
        const newQuizzes = quizzes.filter(
          (q: any) => !allQuizzes.some(
            (existing: any) => (existing.ID || existing.id) === (q.ID || q.id)
          )
        );
        allQuizzes = [...allQuizzes, ...newQuizzes];
        console.log(`  ✅ ${quizzes.length} quiz trouvés (${newQuizzes.length} nouveaux)\n`);
        
        // Si on a trouvé des quiz, continuer pour essayer d'en trouver plus
        if (quizzes.length < 100) {
          break; // Probablement tous les quiz récupérés
        }
      }
    } catch (error: any) {
      console.log(`  ⚠️  ${method.name} non disponible: ${error.message}`);
    }
  }
  
  if (allQuizzes.length === 0) {
    console.log('  ⚠️  Aucun quiz trouvé');
  } else {
    // Afficher le détail des statuts
    const statusCount: Record<string, number> = {};
    allQuizzes.forEach((q: any) => {
      const status = q.post_status || q.status || 'unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    console.log(`  📊 Répartition par statut:`);
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });
    console.log('');
  }
  
  return allQuizzes;
}

/**
 * Fonction principale d'import
 */
async function importAllCourses() {
  console.log('🚀 Début de l\'import de TOUS les cours depuis WordPress\n');
  console.log('=' .repeat(60));
  console.log('');
  
  try {
    // 1. Récupérer tous les cours
    const wpCourses = await getAllCourses();
    
    // 2. Si aucun cours trouvé, récupérer tous les quiz et créer un cours par défaut
    if (wpCourses.length === 0) {
      console.log('📝 Aucun cours trouvé, récupération de tous les quiz...\n');
      
      const allQuizzes = await getAllQuizzes();
      
      if (allQuizzes.length === 0) {
        console.log('⚠️  Aucun quiz trouvé dans WordPress');
        return;
      }
      
      // Créer un cours par défaut "Tous les Quiz"
      const defaultCourse = await prisma.course.upsert({
        where: { slug: 'all-quizzes' },
        update: {},
        create: {
          title: 'Tous les Quiz',
          slug: 'all-quizzes',
          description: 'Cours contenant tous les quiz importés depuis WordPress',
        },
      });
      
      console.log(`✅ Cours par défaut créé: ${defaultCourse.title}\n`);
      
      // Créer un module par défaut
      const defaultModule = await prisma.module.upsert({
        where: {
          courseId_slug: {
            courseId: defaultCourse.id,
            slug: 'default-quizzes',
          },
        },
        update: {},
        create: {
          courseId: defaultCourse.id,
          title: 'Tous les Quiz',
          slug: 'default-quizzes',
          description: 'Module contenant tous les quiz',
          order: 0,
        },
      });
      
      console.log(`✅ Module par défaut créé: ${defaultModule.title}\n`);
      
      // Importer tous les quiz
      console.log(`🔄 Import de ${allQuizzes.length} quiz...\n`);
      let successCount = 0;
      let errorCount = 0;
      
      for (const wpQuiz of allQuizzes) {
        try {
          await importQuiz(wpQuiz, defaultModule.id);
          successCount++;
        } catch (error: any) {
          console.error(`  ❌ Erreur import quiz ${wpQuiz.post_title}: ${error.message}`);
          errorCount++;
        }
      }
      
      console.log('\n📊 Résumé de l\'import:');
      console.log(`  ✅ Quiz importés: ${successCount}`);
      console.log(`  ❌ Erreurs: ${errorCount}`);
      console.log(`  📝 Total: ${allQuizzes.length}`);
      console.log('\n✅ Import terminé avec succès !');
      return;
    }
    
    console.log(`📊 ${wpCourses.length} cours à traiter\n`);
    
    let totalQuizzes = 0;
    let totalQuestions = 0;
    
    // 2. Pour chaque cours
    for (const wpCourse of wpCourses) {
      console.log(`\n📚 Cours: ${wpCourse.post_title} (ID: ${wpCourse.ID})`);
      console.log(`   Statut: ${wpCourse.post_status || 'unknown'}`);
      
      // Créer ou récupérer le cours dans Prisma
      const course = await getOrCreateCourse(wpCourse);
      
      // 3. Récupérer les topics/modules du cours
      const topics = await getCourseTopics(wpCourse.ID);
      
      if (topics.length > 0) {
        console.log(`   📦 ${topics.length} modules/topics trouvés`);
        
        // Créer les modules dans Prisma
        for (let i = 0; i < topics.length; i++) {
          const topic = topics[i];
          const module = await getOrCreateModule(course.id, topic, i);
          
          // 4. Récupérer les quiz du topic
          const quizzes = await getQuizzesForCourse(undefined, topic.ID);
          
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
        
        const quizzes = await getQuizzesForCourse(wpCourse.ID);
        
        if (quizzes.length > 0) {
          console.log(`   📝 ${quizzes.length} quiz trouvés dans ce cours`);
          
          // Créer un module par défaut "Quiz du cours"
          const defaultModule = await getOrCreateModule(
            course.id,
            {
              ID: 0,
              id: 0,
              post_title: 'Quiz du cours',
              post_name: 'default-quizzes',
              slug: 'default-quizzes',
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
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Résumé de l\'import:');
    console.log(`  ✅ Cours traités: ${wpCourses.length}`);
    console.log(`  ✅ Quiz importés: ${totalQuizzes}`);
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
importAllCourses()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
