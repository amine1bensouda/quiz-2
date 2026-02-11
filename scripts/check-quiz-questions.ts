import { prisma } from '../src/lib/db';

async function checkQuizQuestions() {
  try {
    // Récupérer tous les quiz avec leurs questions et réponses
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      take: 5, // Limiter à 5 quiz pour le test
    });

    console.log(`\n📊 Vérification de ${quizzes.length} quiz:\n`);

    quizzes.forEach((quiz, quizIndex) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Quiz ${quizIndex + 1}: ${quiz.title} (${quiz.slug})`);
      console.log(`Questions: ${quiz.questions.length}`);
      console.log(`${'='.repeat(80)}\n`);

      quiz.questions.forEach((question, qIndex) => {
        const answersCount = question.answers.length;
        const status = answersCount > 0 ? '✅' : '❌';
        
        console.log(`${status} Question ${qIndex + 1} (ID: ${question.id}):`);
        console.log(`   Texte: ${question.text?.substring(0, 60)}...`);
        console.log(`   Type: ${question.type}`);
        console.log(`   Réponses: ${answersCount}`);
        
        if (answersCount > 0) {
          question.answers.forEach((answer, aIndex) => {
            console.log(`      ${aIndex + 1}. ${answer.text?.substring(0, 40)}... (Correct: ${answer.isCorrect})`);
          });
        } else {
          console.log(`      ⚠️ Aucune réponse disponible`);
        }
        console.log('');
      });
    });

    // Statistiques globales
    const totalQuestions = quizzes.reduce((sum, q) => sum + q.questions.length, 0);
    const questionsWithoutAnswers = quizzes.reduce(
      (sum, q) => sum + q.questions.filter((q) => q.answers.length === 0).length,
      0
    );

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📈 Statistiques:`);
    console.log(`   Total de questions: ${totalQuestions}`);
    console.log(`   Questions sans réponses: ${questionsWithoutAnswers}`);
    console.log(`   Questions avec réponses: ${totalQuestions - questionsWithoutAnswers}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuizQuestions();
