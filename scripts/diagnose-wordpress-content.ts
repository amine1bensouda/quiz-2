/**
 * Script de diagnostic pour voir tout le contenu disponible dans WordPress
 * (publié et non publié)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import axios from 'axios';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost/test2';

const tutorApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/tutor/v1`,
  timeout: 30000,
});

const wpApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/wp/v2`,
  timeout: 30000,
});

async function diagnoseContent() {
  console.log('🔍 Diagnostic du contenu WordPress\n');
  console.log('='.repeat(60));
  console.log(`URL WordPress: ${WORDPRESS_API_URL}\n`);

  // 1. Tester les quiz
  console.log('📝 1. QUIZ');
  console.log('-'.repeat(60));
  
  const quizEndpoints = [
    { name: '/tutor/v1/quizzes', fn: () => tutorApiClient.get('/quizzes', { params: { per_page: 100 } }) },
    { name: '/wp/v2/tutor_quiz (publish)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 100, status: 'publish' } }) },
    { name: '/wp/v2/tutor_quiz (any)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 100, status: 'any' } }) },
    { name: '/wp/v2/tutor_quiz (draft)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 100, status: 'draft' } }) },
    { name: '/wp/v2/tutor_quiz (private)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 100, status: 'private' } }) },
  ];

  let totalQuizzes = 0;
  const quizStatuses: Record<string, number> = {};

  for (const endpoint of quizEndpoints) {
    try {
      const response = await endpoint.fn();
      const quizzes = response.data?.data || response.data || [];
      const count = Array.isArray(quizzes) ? quizzes.length : 0;
      
      if (count > 0) {
        console.log(`  ✅ ${endpoint.name}: ${count} quiz`);
        
        // Compter les statuts
        quizzes.forEach((q: any) => {
          const status = q.post_status || q.status || 'unknown';
          quizStatuses[status] = (quizStatuses[status] || 0) + 1;
        });
        
        totalQuizzes = Math.max(totalQuizzes, count);
      }
    } catch (error: any) {
      console.log(`  ❌ ${endpoint.name}: ${error.response?.status || error.message}`);
    }
  }

  console.log(`\n  📊 Total quiz trouvés: ${totalQuizzes}`);
  if (Object.keys(quizStatuses).length > 0) {
    console.log(`  📊 Répartition par statut:`);
    Object.entries(quizStatuses).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });
  }

  // 2. Tester les cours
  console.log('\n📚 2. COURS');
  console.log('-'.repeat(60));

  const courseEndpoints = [
    { name: '/tutor/v1/courses', fn: () => tutorApiClient.get('/courses', { params: { per_page: 100 } }) },
    { name: '/wp/v2/tutor_course (publish)', fn: () => wpApiClient.get('/tutor_course', { params: { per_page: 100, status: 'publish' } }) },
    { name: '/wp/v2/tutor_course (any)', fn: () => wpApiClient.get('/tutor_course', { params: { per_page: 100, status: 'any' } }) },
    { name: '/wp/v2/tutor_course (draft)', fn: () => wpApiClient.get('/tutor_course', { params: { per_page: 100, status: 'draft' } }) },
    { name: '/wp/v2/courses (publish)', fn: () => wpApiClient.get('/courses', { params: { per_page: 100, status: 'publish' } }) },
    { name: '/wp/v2/courses (any)', fn: () => wpApiClient.get('/courses', { params: { per_page: 100, status: 'any' } }) },
  ];

  let totalCourses = 0;
  const courseStatuses: Record<string, number> = {};

  for (const endpoint of courseEndpoints) {
    try {
      const response = await endpoint.fn();
      const courses = response.data?.data || response.data || [];
      const count = Array.isArray(courses) ? courses.length : 0;
      
      if (count > 0) {
        console.log(`  ✅ ${endpoint.name}: ${count} cours`);
        
        courses.forEach((c: any) => {
          const status = c.post_status || c.status || 'unknown';
          courseStatuses[status] = (courseStatuses[status] || 0) + 1;
        });
        
        totalCourses = Math.max(totalCourses, count);
      }
    } catch (error: any) {
      console.log(`  ❌ ${endpoint.name}: ${error.response?.status || error.message}`);
    }
  }

  console.log(`\n  📊 Total cours trouvés: ${totalCourses}`);
  if (Object.keys(courseStatuses).length > 0) {
    console.log(`  📊 Répartition par statut:`);
    Object.entries(courseStatuses).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });
  }

  // 3. Tester les topics/modules
  console.log('\n📦 3. TOPICS/MODULES');
  console.log('-'.repeat(60));

  const topicEndpoints = [
    { name: '/tutor/v1/topics', fn: () => tutorApiClient.get('/topics', { params: { per_page: 100 } }) },
    { name: '/wp/v2/tutor_topic (publish)', fn: () => wpApiClient.get('/tutor_topic', { params: { per_page: 100, status: 'publish' } }) },
    { name: '/wp/v2/tutor_topic (any)', fn: () => wpApiClient.get('/tutor_topic', { params: { per_page: 100, status: 'any' } }) },
  ];

  let totalTopics = 0;

  for (const endpoint of topicEndpoints) {
    try {
      const response = await endpoint.fn();
      const topics = response.data?.data || response.data || [];
      const count = Array.isArray(topics) ? topics.length : 0;
      
      if (count > 0) {
        console.log(`  ✅ ${endpoint.name}: ${count} topics`);
        totalTopics = Math.max(totalTopics, count);
      }
    } catch (error: any) {
      console.log(`  ❌ ${endpoint.name}: ${error.response?.status || error.message}`);
    }
  }

  console.log(`\n  📊 Total topics trouvés: ${totalTopics}`);

  // 4. Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`Quiz: ${totalQuizzes}`);
  console.log(`Cours: ${totalCourses}`);
  console.log(`Topics: ${totalTopics}`);

  if (totalCourses === 0 && totalQuizzes > 0) {
    console.log('\n💡 RECOMMANDATION:');
    console.log('   Les quiz sont disponibles mais pas les cours.');
    console.log('   Le script d\'import va créer un cours par défaut pour organiser les quiz.');
  }

  if (totalQuizzes === 0) {
    console.log('\n⚠️  ATTENTION:');
    console.log('   Aucun quiz trouvé. Vérifiez que:');
    console.log('   1. Tutor LMS est installé et activé');
    console.log('   2. Le plugin Tutor LMS REST API est activé');
    console.log('   3. Il y a des quiz dans WordPress');
    console.log('   4. L\'URL WORDPRESS_API_URL est correcte');
  }
}

diagnoseContent()
  .then(() => {
    console.log('\n✅ Diagnostic terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
