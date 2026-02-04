/**
 * Script de test pour vérifier que les quiz sont bien transférés
 * avec les questions et les bonnes réponses
 */

import { getAllQuiz, getQuizBySlug } from './src/lib/wordpress';

async function testQuizData() {
  console.log('🧪 Début des tests de transfert des quiz\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Récupérer tous les quiz
    console.log('\n📋 TEST 1: Récupération de tous les quiz');
    console.log('-'.repeat(60));
    const allQuizzes = await getAllQuiz();
    console.log(`✅ ${allQuizzes.length} quiz récupérés\n`);

    if (allQuizzes.length === 0) {
      console.error('❌ Aucun quiz trouvé !');
      return;
    }

    // Afficher les quiz
    allQuizzes.forEach((quiz, index) => {
      console.log(`Quiz ${index + 1}:`);
      console.log(`  - ID: ${quiz.id}`);
      console.log(`  - Titre: ${quiz.title.rendered}`);
      console.log(`  - Slug: ${quiz.slug}`);
      console.log(`  - Nombre de questions (acf): ${quiz.acf?.nombre_questions || 0}`);
      console.log(`  - Questions dans acf.questions: ${quiz.acf?.questions?.length || 0}`);
      console.log('');
    });

    // Test 2: Récupérer un quiz spécifique avec ses questions
    console.log('\n📋 TEST 2: Récupération d\'un quiz spécifique avec questions');
    console.log('-'.repeat(60));
    
    const firstQuiz = allQuizzes[0];
    if (!firstQuiz) {
      console.error('❌ Aucun quiz disponible pour le test');
      return;
    }

    console.log(`Récupération du quiz: ${firstQuiz.slug}`);
    const quizWithQuestions = await getQuizBySlug(firstQuiz.slug);

    if (!quizWithQuestions) {
      console.error('❌ Quiz non trouvé par slug');
      return;
    }

    console.log(`✅ Quiz récupéré: ${quizWithQuestions.title.rendered}`);
    console.log(`   - ID: ${quizWithQuestions.id}`);
    console.log(`   - Nombre de questions: ${quizWithQuestions.acf?.questions?.length || 0}\n`);

    // Test 3: Vérifier les questions
    console.log('\n📋 TEST 3: Vérification des questions');
    console.log('-'.repeat(60));
    
    const questions = quizWithQuestions.acf?.questions || [];
    console.log(`Nombre de questions: ${questions.length}\n`);

    if (questions.length === 0) {
      console.error('❌ Aucune question trouvée dans le quiz !');
      return;
    }

    questions.forEach((question, qIndex) => {
      console.log(`\nQuestion ${qIndex + 1}:`);
      console.log(`  - ID: ${question.id || 'N/A'}`);
      console.log(`  - Texte: ${(question.texte_question || question.title?.rendered || 'SANS TITRE').substring(0, 60)}...`);
      console.log(`  - Type: ${question.type_question || 'N/A'}`);
      console.log(`  - Points: ${question.points || 'N/A'}`);
      
      const answers = question.reponses || question.acf?.reponses || [];
      console.log(`  - Nombre de réponses: ${answers.length}`);

      if (answers.length === 0) {
        console.error(`  ❌ Question ${qIndex + 1} n'a pas de réponses !`);
        return;
      }

      // Vérifier les réponses
      let correctAnswerFound = false;
      answers.forEach((answer, aIndex) => {
        const answerAny = answer as any;
        const isCorrect = answerAny.correcte === true ||
                         answerAny.correcte === 1 ||
                         answerAny.correcte === 'yes' ||
                         answerAny.is_correct === true ||
                         answerAny.is_correct === 1 ||
                         answerAny.is_correct === 'yes' ||
                         answerAny.correct === true;

        console.log(`    Réponse ${aIndex + 1} (${String.fromCharCode(65 + aIndex)}):`);
        console.log(`      - Texte: ${(answer.texte || '').substring(0, 50)}...`);
        console.log(`      - Correcte: ${answer.correcte} (${typeof answer.correcte})`);
        console.log(`      - is_correct: ${answerAny.is_correct || 'N/A'}`);
        console.log(`      - correct: ${answerAny.correct || 'N/A'}`);
        console.log(`      - Détecté comme correcte: ${isCorrect ? '✅ OUI' : '❌ NON'}`);

        if (isCorrect) {
          correctAnswerFound = true;
        }
      });

      if (!correctAnswerFound) {
        console.error(`  ❌ Question ${qIndex + 1} n'a pas de bonne réponse identifiée !`);
      } else {
        console.log(`  ✅ Question ${qIndex + 1} a au moins une bonne réponse`);
      }
    });

    // Test 4: Vérifier la structure complète
    console.log('\n\n📋 TEST 4: Vérification de la structure complète');
    console.log('-'.repeat(60));
    
    const structureCheck = {
      quizHasId: !!quizWithQuestions.id,
      quizHasSlug: !!quizWithQuestions.slug,
      quizHasTitle: !!quizWithQuestions.title?.rendered,
      quizHasAcf: !!quizWithQuestions.acf,
      quizHasQuestions: !!quizWithQuestions.acf?.questions,
      questionsCount: questions.length,
      allQuestionsHaveText: questions.every(q => 
        (q.texte_question || q.title?.rendered || '').trim() !== ''
      ),
      allQuestionsHaveAnswers: questions.every(q => {
        const answers = q.reponses || q.acf?.reponses || [];
        return answers.length > 0;
      }),
      allQuestionsHaveCorrectAnswer: questions.every(q => {
        const answers = q.reponses || q.acf?.reponses || [];
        return answers.some(a => {
          const aAny = a as any;
          return aAny.correcte === true ||
          aAny.correcte === 1 ||
          aAny.correcte === 'yes' ||
          aAny.is_correct === true ||
          aAny.is_correct === 1 ||
          aAny.is_correct === 'yes' ||
          aAny.correct === true;
        });
      }),
    };

    console.log('\nRésultats de la vérification:');
    Object.entries(structureCheck).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      console.log(`  ${icon} ${key}: ${value}`);
    });

    // Résumé final
    console.log('\n\n📊 RÉSUMÉ');
    console.log('='.repeat(60));
    const allTestsPassed = Object.values(structureCheck).every(v => v === true);
    
    if (allTestsPassed) {
      console.log('✅ Tous les tests sont passés !');
      console.log(`✅ ${questions.length} questions avec réponses correctement identifiées`);
    } else {
      console.log('❌ Certains tests ont échoué');
      console.log('Vérifiez les détails ci-dessus pour identifier les problèmes');
    }

  } catch (error: any) {
    console.error('\n❌ Erreur lors des tests:', error);
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Exécuter les tests
testQuizData().then(() => {
  console.log('\n✅ Tests terminés');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});


