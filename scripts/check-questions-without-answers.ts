/**
 * Script pour vérifier les questions sans réponses dans la base de données
 */

import { prisma } from '../src/lib/db';

async function checkQuestionsWithoutAnswers() {
  try {
    console.log('🔍 Vérification des questions sans réponses...\n');

    // Récupérer tous les quiz avec leurs questions et réponses
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    console.log(`📊 Total de quiz: ${quizzes.length}\n`);

    let totalQuestions = 0;
    let questionsWithoutAnswers = 0;
    const problematicQuestions: Array<{
      quizSlug: string;
      quizTitle: string;
      questionId: string;
      questionText: string;
    }> = [];

    for (const quiz of quizzes) {
      for (const question of quiz.questions) {
        totalQuestions++;
        
        if (!question.answers || question.answers.length === 0) {
          questionsWithoutAnswers++;
          problematicQuestions.push({
            quizSlug: quiz.slug,
            quizTitle: quiz.title,
            questionId: question.id,
            questionText: question.text?.substring(0, 100) || 'Sans texte',
          });
        }
      }
    }

    console.log(`📈 Statistiques:`);
    console.log(`   - Total de questions: ${totalQuestions}`);
    console.log(`   - Questions sans réponses: ${questionsWithoutAnswers}`);
    console.log(`   - Pourcentage: ${totalQuestions > 0 ? ((questionsWithoutAnswers / totalQuestions) * 100).toFixed(2) : 0}%\n`);

    if (problematicQuestions.length > 0) {
      console.log('❌ Questions sans réponses trouvées:\n');
      problematicQuestions.forEach((q, index) => {
        console.log(`${index + 1}. Quiz: "${q.quizTitle}" (${q.quizSlug})`);
        console.log(`   Question ID: ${q.questionId}`);
        console.log(`   Texte: ${q.questionText}...\n`);
      });

      console.log('\n💡 Pour corriger ces questions:');
      console.log('   1. Allez dans l\'interface admin: /admin/quizzes');
      console.log('   2. Trouvez le quiz concerné');
      console.log('   3. Éditez le quiz et ajoutez des réponses aux questions sans réponses');
      console.log('   4. Ou utilisez Prisma Studio: npx prisma studio');
    } else {
      console.log('✅ Toutes les questions ont au moins une réponse!');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestionsWithoutAnswers();
