/**
 * Script pour vérifier une question spécifique et ses réponses
 */

import { prisma } from '../src/lib/db';

const questionId = 'cmky9s51506jwv2jsa3pout10'; // ID de la question problématique

async function checkQuestion() {
  try {
    console.log(`🔍 Vérification de la question: ${questionId}\n`);

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        answers: true,
      },
    });

    if (!question) {
      console.log('❌ Question non trouvée dans la base de données');
      return;
    }

    console.log('✅ Question trouvée:');
    console.log(`   ID: ${question.id}`);
    console.log(`   Texte: ${question.text?.substring(0, 100)}...`);
    console.log(`   Quiz: ${question.quiz.title} (${question.quiz.slug})`);
    console.log(`   Nombre de réponses: ${question.answers.length}\n`);

    if (question.answers.length === 0) {
      console.log('❌ Cette question n\'a AUCUNE réponse!\n');
      console.log('💡 Pour corriger:');
      console.log(`   1. Allez sur: /admin/quizzes/${question.quiz.slug}/edit`);
      console.log(`   2. Trouvez la question "${question.text?.substring(0, 50)}..."`);
      console.log('   3. Ajoutez au moins 2 réponses (une correcte et une incorrecte)');
      console.log('   4. Sauvegardez le quiz');
    } else {
      console.log('✅ Réponses trouvées:');
      question.answers
        .sort((a, b) => a.order - b.order)
        .forEach((answer, index) => {
          console.log(`   ${index + 1}. ${answer.isCorrect ? '✓' : '✗'} ${answer.text?.substring(0, 50)}...`);
        });
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestion();
