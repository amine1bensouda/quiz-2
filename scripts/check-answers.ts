import { prisma } from '../src/lib/db';

async function checkAnswers() {
  try {
    const questionId = 'cmky9r6cr05f6v2jsqphyoyix';
    
    // Vérifier les réponses pour cette question spécifique
    const answers = await prisma.answer.findMany({
      where: { questionId },
    });
    
    console.log(`\n📊 Réponses pour la question ${questionId}:`);
    console.log(`   Nombre de réponses: ${answers.length}\n`);
    
    if (answers.length > 0) {
      answers.forEach((a, index) => {
        console.log(`   ${index + 1}. ${a.text?.substring(0, 50)}... (Correct: ${a.isCorrect})`);
      });
    } else {
      console.log('   ⚠️ Aucune réponse trouvée pour cette question\n');
    }
    
    // Vérifier toutes les questions du quiz
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });
    
    if (question) {
      console.log(`\n📊 Quiz: ${question.quiz.title}`);
      console.log(`   Total de questions: ${question.quiz.questions.length}\n`);
      
      question.quiz.questions.forEach((q, index) => {
        const answersCount = q.answers.length;
        console.log(`   Question ${index + 1} (ID: ${q.id}): ${answersCount} réponses`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnswers();
