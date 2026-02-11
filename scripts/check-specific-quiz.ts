import { prisma } from '../src/lib/db';
import { convertPrismaQuizToQuiz } from '../src/lib/quiz-service';

async function checkSpecificQuiz() {
  try {
    // Récupérer le quiz avec l'ID mentionné dans l'erreur
    const questionId = 'cmky9r6cr05f6v2jsqphyoyix';
    
    // D'abord, trouver le quiz qui contient cette question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
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
        },
      },
    });

    if (!question) {
      console.log(`❌ Question ${questionId} non trouvée`);
      return;
    }

    console.log(`\n📊 Quiz trouvé: ${question.quiz.title} (${question.quiz.slug})\n`);
    console.log(`Questions dans le quiz: ${question.quiz.questions.length}\n`);

    // Afficher toutes les questions
    question.quiz.questions.forEach((q, index) => {
      console.log(`Question ${index + 1} (ID: ${q.id}):`);
      console.log(`   Texte: ${q.text?.substring(0, 80)}...`);
      console.log(`   Réponses: ${q.answers.length}`);
      if (q.answers.length > 0) {
        q.answers.forEach((a, aIndex) => {
          console.log(`      ${aIndex + 1}. ${a.text?.substring(0, 40)}... (Correct: ${a.isCorrect})`);
        });
      }
      console.log('');
    });

    // Convertir le quiz et vérifier le résultat
    console.log('\n🔄 Conversion du quiz:\n');
    const convertedQuiz = convertPrismaQuizToQuiz(question.quiz);
    
    console.log(`Questions converties: ${convertedQuiz.acf?.questions?.length || 0}\n`);
    
    if (convertedQuiz.acf?.questions) {
      convertedQuiz.acf.questions.forEach((q: any, index: number) => {
        console.log(`Question ${index + 1} convertie:`);
        console.log(`   ID: ${q.id}`);
        console.log(`   Texte: ${q.texte_question?.substring(0, 80)}...`);
        console.log(`   Réponses: ${q.reponses?.length || 0}`);
        if (q.reponses && q.reponses.length > 0) {
          q.reponses.forEach((a: any, aIndex: number) => {
            console.log(`      ${aIndex + 1}. ${a.texte?.substring(0, 40)}... (Correct: ${a.correcte})`);
          });
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificQuiz();
