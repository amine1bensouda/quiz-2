/**
 * Script de test simple pour vérifier l'API WordPress directement
 * Utilise Node.js avec axios (pas besoin de TypeScript)
 */

const axios = require('axios');

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost/test2';
const tutorApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/tutor/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testQuizAPI() {
  console.log('🧪 Test de l\'API Tutor LMS\n');
  console.log('='.repeat(60));
  console.log(`URL de base: ${WORDPRESS_API_URL}/wp-json/tutor/v1\n`);

  try {
    // Test 1: Récupérer tous les quiz
    console.log('📋 TEST 1: Récupération de tous les quiz');
    console.log('-'.repeat(60));
    
    const quizzesResponse = await tutorApiClient.get('/quizzes', {
      params: { per_page: 100 }
    });

    let quizzesData = [];
    if (quizzesResponse.data?.data && Array.isArray(quizzesResponse.data.data)) {
      quizzesData = quizzesResponse.data.data;
    } else if (Array.isArray(quizzesResponse.data)) {
      quizzesData = quizzesResponse.data;
    }

    console.log(`✅ ${quizzesData.length} quiz récupérés\n`);

    if (quizzesData.length === 0) {
      console.error('❌ Aucun quiz trouvé !');
      return;
    }

    // Afficher les quiz
    quizzesData.forEach((quiz, index) => {
      console.log(`Quiz ${index + 1}:`);
      console.log(`  - ID: ${quiz.ID || quiz.id}`);
      console.log(`  - Titre: ${quiz.post_title || quiz.title}`);
      console.log(`  - Slug: ${quiz.post_name || quiz.slug}`);
      console.log('');
    });

    // Test 2: Récupérer les questions d'un quiz
    console.log('\n📋 TEST 2: Récupération des questions d\'un quiz');
    console.log('-'.repeat(60));
    
    const firstQuiz = quizzesData[0];
    const quizId = firstQuiz.ID || firstQuiz.id;
    
    console.log(`Récupération des questions pour le quiz ID: ${quizId}`);
    console.log(`Titre: ${firstQuiz.post_title || firstQuiz.title}\n`);

    // Essayer plusieurs routes
    let questionsData = [];
    let routeUsed = '';

    // Route 1: /questions?quiz_id={id}
    try {
      const response = await tutorApiClient.get('/questions', {
        params: { quiz_id: quizId }
      });
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        questionsData = response.data.data;
        routeUsed = '/questions?quiz_id={id}';
      } else if (Array.isArray(response.data)) {
        questionsData = response.data;
        routeUsed = '/questions?quiz_id={id}';
      }
    } catch (error) {
      console.log('⚠️ Route /questions?quiz_id={id} a échoué, essai autre route...');
    }

    // Route 2: /quiz/{id}/questions
    if (questionsData.length === 0) {
      try {
        const response = await tutorApiClient.get(`/quiz/${quizId}/questions`);
        
        if (response.data?.data && Array.isArray(response.data.data)) {
          questionsData = response.data.data;
          routeUsed = '/quiz/{id}/questions';
        } else if (Array.isArray(response.data)) {
          questionsData = response.data;
          routeUsed = '/quiz/{id}/questions';
        }
      } catch (error) {
        console.log('⚠️ Route /quiz/{id}/questions a échoué');
      }
    }

    console.log(`✅ ${questionsData.length} questions récupérées via: ${routeUsed}\n`);

    if (questionsData.length === 0) {
      console.error('❌ Aucune question trouvée !');
      return;
    }

    // Test 3: Vérifier la structure des questions et réponses
    console.log('\n📋 TEST 3: Vérification de la structure des questions');
    console.log('-'.repeat(60));

    questionsData.forEach((question, qIndex) => {
      console.log(`\nQuestion ${qIndex + 1}:`);
      console.log(`  - ID: ${question.question_id || question.id || 'N/A'}`);
      
      // Essayer plusieurs champs pour le texte
      const questionText = question.question_title || 
                          question.question || 
                          question.title || 
                          question.question_name ||
                          question.question_text ||
                          'SANS TITRE';
      console.log(`  - Texte: ${questionText.substring(0, 60)}...`);
      console.log(`  - Type: ${question.question_type || 'N/A'}`);
      console.log(`  - Points: ${question.question_mark || question.points || 'N/A'}`);
      
      const answers = question.answers || [];
      console.log(`  - Nombre de réponses: ${answers.length}`);

      if (answers.length === 0) {
        console.error(`  ❌ Question ${qIndex + 1} n'a pas de réponses !`);
        return;
      }

      // Vérifier les réponses
      let correctAnswerFound = false;
      answers.forEach((answer, aIndex) => {
        const isCorrect = answer.is_correct === true || 
                         answer.is_correct === 1 || 
                         answer.is_correct === 'yes' ||
                         answer.correct === true ||
                         answer.correct === 1 ||
                         answer.correct === 'yes';

        const answerText = answer.answer_title || 
                          answer.answer || 
                          answer.text || 
                          answer.answer_text ||
                          'SANS TEXTE';

        console.log(`    Réponse ${aIndex + 1} (${String.fromCharCode(65 + aIndex)}):`);
        console.log(`      - Texte: ${answerText.substring(0, 50)}...`);
        console.log(`      - is_correct: ${answer.is_correct} (${typeof answer.is_correct})`);
        console.log(`      - correct: ${answer.correct || 'N/A'}`);
        console.log(`      - Détecté comme correcte: ${isCorrect ? '✅ OUI' : '❌ NON'}`);

        if (isCorrect) {
          correctAnswerFound = true;
        }
      });

      if (!correctAnswerFound) {
        console.error(`  ❌ Question ${qIndex + 1} n'a pas de bonne réponse identifiée !`);
        console.log(`  Structure complète de la question:`, JSON.stringify(question, null, 2).substring(0, 500));
      } else {
        console.log(`  ✅ Question ${qIndex + 1} a au moins une bonne réponse`);
      }
    });

    // Résumé final
    console.log('\n\n📊 RÉSUMÉ');
    console.log('='.repeat(60));
    
    const questionsWithText = questionsData.filter(q => {
      const text = q.question_title || q.question || q.title || q.question_name || q.question_text || '';
      return text.trim() !== '';
    });

    const questionsWithAnswers = questionsData.filter(q => {
      const answers = q.answers || [];
      return answers.length > 0;
    });

    const questionsWithCorrectAnswer = questionsData.filter(q => {
      const answers = q.answers || [];
      return answers.some(a => 
        a.is_correct === true || 
        a.is_correct === 1 || 
        a.is_correct === 'yes' ||
        a.correct === true ||
        a.correct === 1 ||
        a.correct === 'yes'
      );
    });

    console.log(`Total de questions: ${questionsData.length}`);
    console.log(`Questions avec texte: ${questionsWithText.length} / ${questionsData.length}`);
    console.log(`Questions avec réponses: ${questionsWithAnswers.length} / ${questionsData.length}`);
    console.log(`Questions avec bonne réponse: ${questionsWithCorrectAnswer.length} / ${questionsData.length}`);

    if (questionsWithText.length === questionsData.length &&
        questionsWithAnswers.length === questionsData.length &&
        questionsWithCorrectAnswer.length === questionsData.length) {
      console.log('\n✅ Tous les tests sont passés !');
    } else {
      console.log('\n❌ Certains tests ont échoué');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Exécuter les tests
testQuizAPI().then(() => {
  console.log('\n✅ Tests terminés');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});


