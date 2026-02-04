/**
 * Script de test des endpoints API du backend indépendant
 * 
 * Usage: npx tsx scripts/test-api-endpoints.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testEndpoint(name: string, url: string, options?: RequestInit) {
  try {
    console.log(`\n🧪 Test: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Succès (${response.status})`);
      if (Array.isArray(data)) {
        console.log(`   📊 Résultats: ${data.length} éléments`);
        if (data.length > 0) {
          console.log(`   📝 Premier élément:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
        }
      } else {
        console.log(`   📝 Réponse:`, JSON.stringify(data, null, 2).substring(0, 300));
      }
      return { success: true, data };
    } else {
      console.log(`   ❌ Erreur (${response.status}):`, data);
      return { success: false, error: data };
    }
  } catch (error: any) {
    console.log(`   ❌ Exception:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Test des endpoints API du backend indépendant');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Liste tous les quiz
  await testEndpoint(
    'GET /api/quizzes - Liste tous les quiz',
    `${BASE_URL}/api/quizzes`
  );

  // Test 2: Liste avec limite
  await testEndpoint(
    'GET /api/quizzes?limit=5 - Limite à 5 quiz',
    `${BASE_URL}/api/quizzes?limit=5`
  );

  // Test 3: Récupère un quiz spécifique (premier slug disponible)
  const quizzesResponse = await fetch(`${BASE_URL}/api/quizzes`);
  if (quizzesResponse.ok) {
    const quizzes = await quizzesResponse.json();
    if (quizzes.length > 0) {
      const firstQuiz = quizzes[0];
      const slug = firstQuiz.slug;
      await testEndpoint(
        `GET /api/quizzes/[slug] - Quiz "${slug}"`,
        `${BASE_URL}/api/quizzes/${slug}`
      );
    }
  }

  // Test 4: Liste toutes les catégories
  await testEndpoint(
    'GET /api/categories - Liste toutes les catégories',
    `${BASE_URL}/api/categories`
  );

  // Test 5: Créer un quiz (test)
  const testQuiz = {
    title: 'Quiz de Test API',
    slug: `test-api-${Date.now()}`,
    description: 'Quiz créé via script de test',
    excerpt: 'Test API',
    duration: 5,
    difficulty: 'Facile',
    passingGrade: 50,
    randomizeOrder: false,
    questions: [
      {
        text: 'Question de test?',
        type: 'multiple_choice',
        points: 1,
        explanation: 'C\'est une question de test',
        order: 0,
        answers: [
          { text: 'Réponse correcte', isCorrect: true, order: 0 },
          { text: 'Réponse incorrecte', isCorrect: false, order: 1 },
        ],
      },
    ],
  };

  const createResult = await testEndpoint(
    'POST /api/admin/quizzes - Créer un quiz de test',
    `${BASE_URL}/api/admin/quizzes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testQuiz),
    }
  );

  // Test 6: Supprimer le quiz de test si créé
  if (createResult.success && createResult.data?.id) {
    const quizId = createResult.data.id;
    await testEndpoint(
      `DELETE /api/admin/quizzes/[id] - Supprimer le quiz de test (ID: ${quizId})`,
      `${BASE_URL}/api/admin/quizzes/${quizId}`,
      {
        method: 'DELETE',
      }
    );
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés!');
  console.log('\n💡 Astuce: Ouvre Prisma Studio pour voir les données:');
  console.log('   npx prisma studio');
}

runTests().catch(console.error);
