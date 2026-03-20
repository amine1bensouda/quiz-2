/**
 * Vérification approfondie du contenu WordPress
 * Teste plusieurs méthodes et endpoints pour trouver tous les cours et quiz
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

async function verificationApprofondie() {
  console.log('🔍 VÉRIFICATION APPROFONDIE DU CONTENU WORDPRESS\n');
  console.log('='.repeat(70));
  console.log(`URL WordPress: ${WORDPRESS_API_URL}\n`);

  // 1. Tester tous les endpoints possibles pour les quiz
  console.log('📝 1. RECHERCHE DE TOUS LES QUIZ (tous statuts)\n');
  console.log('-'.repeat(70));

  const quizTests = [
    { name: 'Tutor LMS /quizzes (sans param)', fn: () => tutorApiClient.get('/quizzes') },
    { name: 'Tutor LMS /quizzes (per_page=200)', fn: () => tutorApiClient.get('/quizzes', { params: { per_page: 200 } }) },
    { name: 'Tutor LMS /quizzes (status=any)', fn: () => tutorApiClient.get('/quizzes', { params: { status: 'any' } }) },
    { name: 'Tutor LMS /quizzes (status=draft)', fn: () => tutorApiClient.get('/quizzes', { params: { status: 'draft' } }) },
    { name: 'Tutor LMS /quizzes (status=private)', fn: () => tutorApiClient.get('/quizzes', { params: { status: 'private' } }) },
    { name: 'Tutor LMS /quizzes (status=pending)', fn: () => tutorApiClient.get('/quizzes', { params: { status: 'pending' } }) },
    { name: 'WordPress /tutor_quiz (publish)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 200, status: 'publish' } }) },
    { name: 'WordPress /tutor_quiz (draft)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 200, status: 'draft' } }) },
    { name: 'WordPress /tutor_quiz (private)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 200, status: 'private' } }) },
    { name: 'WordPress /tutor_quiz (pending)', fn: () => wpApiClient.get('/tutor_quiz', { params: { per_page: 200, status: 'pending' } }) },
  ];

  const allQuizzes = new Map<number, any>();
  const quizStats: Record<string, { count: number; endpoints: string[] }> = {};

  for (const test of quizTests) {
    try {
      const response = await test.fn();
      const quizzes = response.data?.data || response.data || [];
      const quizArray = Array.isArray(quizzes) ? quizzes : [];
      
      if (quizArray.length > 0) {
        console.log(`  ✅ ${test.name}: ${quizArray.length} quiz`);
        
        quizArray.forEach((q: any) => {
          const id = q.ID || q.id;
          const status = q.post_status || q.status || 'unknown';
          
          if (!allQuizzes.has(id)) {
            allQuizzes.set(id, q);
            
            if (!quizStats[status]) {
              quizStats[status] = { count: 0, endpoints: [] };
            }
            quizStats[status].count++;
            if (!quizStats[status].endpoints.includes(test.name)) {
              quizStats[status].endpoints.push(test.name);
            }
          }
        });
      }
    } catch (error: any) {
      const status = error.response?.status;
      if (status !== 400 && status !== 404) {
        console.log(`  ⚠️  ${test.name}: ${status || error.message}`);
      }
    }
  }

  console.log(`\n  📊 Total quiz uniques trouvés: ${allQuizzes.size}`);
  if (Object.keys(quizStats).length > 0) {
    console.log(`  📊 Répartition par statut:`);
    Object.entries(quizStats).forEach(([status, info]) => {
      console.log(`     - ${status}: ${info.count} quiz`);
    });
  }

  // 2. Tester tous les endpoints possibles pour les cours
  console.log('\n📚 2. RECHERCHE DE TOUS LES COURS (tous statuts)\n');
  console.log('-'.repeat(70));

  const courseTests = [
    { name: 'Tutor LMS /courses', fn: () => tutorApiClient.get('/courses') },
    { name: 'Tutor LMS /courses (per_page=200)', fn: () => tutorApiClient.get('/courses', { params: { per_page: 200 } }) },
    { name: 'Tutor LMS /courses (status=any)', fn: () => tutorApiClient.get('/courses', { params: { status: 'any' } }) },
    { name: 'Tutor LMS /courses (status=draft)', fn: () => tutorApiClient.get('/courses', { params: { status: 'draft' } }) },
    { name: 'Tutor LMS /courses (status=private)', fn: () => tutorApiClient.get('/courses', { params: { status: 'private' } }) },
    { name: 'WordPress /tutor_course (publish)', fn: () => wpApiClient.get('/tutor_course', { params: { per_page: 200, status: 'publish' } }) },
    { name: 'WordPress /tutor_course (draft)', fn: () => wpApiClient.get('/tutor_course', { params: { per_page: 200, status: 'draft' } }) },
    { name: 'WordPress /tutor_course (private)', fn: () => wpApiClient.get('/tutor_course', { params: { per_page: 200, status: 'private' } }) },
    { name: 'WordPress /courses (publish)', fn: () => wpApiClient.get('/courses', { params: { per_page: 200, status: 'publish' } }) },
    { name: 'WordPress /courses (draft)', fn: () => wpApiClient.get('/courses', { params: { per_page: 200, status: 'draft' } }) },
    { name: 'WordPress /posts (type=tutor_course)', fn: () => wpApiClient.get('/posts', { params: { per_page: 200, type: 'tutor_course' } }) },
  ];

  const allCourses = new Map<number, any>();
  const courseStats: Record<string, { count: number; endpoints: string[] }> = {};

  for (const test of courseTests) {
    try {
      const response = await test.fn();
      const courses = response.data?.data || response.data || [];
      const courseArray = Array.isArray(courses) ? courses : [];
      
      if (courseArray.length > 0) {
        console.log(`  ✅ ${test.name}: ${courseArray.length} cours`);
        
        courseArray.forEach((c: any) => {
          const id = c.ID || c.id;
          const status = c.post_status || c.status || 'unknown';
          
          if (!allCourses.has(id)) {
            allCourses.set(id, c);
            
            if (!courseStats[status]) {
              courseStats[status] = { count: 0, endpoints: [] };
            }
            courseStats[status].count++;
            if (!courseStats[status].endpoints.includes(test.name)) {
              courseStats[status].endpoints.push(test.name);
            }
          }
        });
      }
    } catch (error: any) {
      const status = error.response?.status;
      if (status !== 400 && status !== 404) {
        console.log(`  ⚠️  ${test.name}: ${status || error.message}`);
      }
    }
  }

  console.log(`\n  📊 Total cours uniques trouvés: ${allCourses.size}`);
  if (Object.keys(courseStats).length > 0) {
    console.log(`  📊 Répartition par statut:`);
    Object.entries(courseStats).forEach(([status, info]) => {
      console.log(`     - ${status}: ${info.count} cours`);
      console.log(`       Trouvés via: ${info.endpoints.join(', ')}`);
    });
  } else {
    console.log(`  ⚠️  Aucun cours trouvé via l'API REST`);
  }

  // 3. Lister quelques exemples de quiz trouvés
  if (allQuizzes.size > 0) {
    console.log('\n📋 3. EXEMPLES DE QUIZ TROUVÉS\n');
    console.log('-'.repeat(70));
    
    let count = 0;
    for (const [id, quiz] of allQuizzes.entries()) {
      if (count >= 10) break;
      const title = quiz.post_title || quiz.title || 'Sans titre';
      const slug = quiz.post_name || quiz.slug || 'sans-slug';
      const status = quiz.post_status || quiz.status || 'unknown';
      console.log(`  ${count + 1}. [${status}] ${title} (slug: ${slug})`);
      count++;
    }
    
    if (allQuizzes.size > 10) {
      console.log(`  ... et ${allQuizzes.size - 10} autres quiz`);
    }
  }

  // 4. Lister quelques exemples de cours trouvés
  if (allCourses.size > 0) {
    console.log('\n📚 4. EXEMPLES DE COURS TROUVÉS\n');
    console.log('-'.repeat(70));
    
    let count = 0;
    for (const [id, course] of allCourses.entries()) {
      if (count >= 10) break;
      const title = course.post_title || course.title || 'Sans titre';
      const slug = course.post_name || course.slug || 'sans-slug';
      const status = course.post_status || course.status || 'unknown';
      console.log(`  ${count + 1}. [${status}] ${title} (slug: ${slug})`);
      count++;
    }
    
    if (allCourses.size > 10) {
      console.log(`  ... et ${allCourses.size - 10} autres cours`);
    }
  }

  // 5. Résumé final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RÉSUMÉ FINAL');
  console.log('='.repeat(70));
  console.log(`Quiz trouvés: ${allQuizzes.size}`);
  console.log(`Cours trouvés: ${allCourses.size}`);
  
  if (allCourses.size === 0 && allQuizzes.size > 0) {
    console.log('\n💡 RECOMMANDATION:');
    console.log('   Les quiz sont disponibles mais les cours ne sont pas exposés via l\'API.');
    console.log('   Options:');
    console.log('   1. Vérifier dans WordPress Admin (Tutor LMS → Courses)');
    console.log('   2. Modifier le plugin Tutor LMS REST API pour exposer les cours');
    console.log('   3. Créer les cours manuellement via l\'interface admin (/admin/courses)');
  }

  if (allQuizzes.size === 0) {
    console.log('\n⚠️  ATTENTION:');
    console.log('   Aucun quiz trouvé. Vérifiez la configuration WordPress.');
  }
}

verificationApprofondie()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
