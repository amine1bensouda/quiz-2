import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import QuizForm from '@/components/Admin/QuizForm';

export default async function EditQuizPage({ params }: { params: { id: string } }) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      module: {
        include: {
          course: true,
        },
      },
      questions: {
        include: {
          answers: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // Convertir au format attendu par le formulaire
  const quizData = {
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    moduleId: quiz.moduleId || '',
    description: quiz.description || '',
    excerpt: quiz.excerpt || '',
    duration: quiz.duration,
    difficulty: quiz.difficulty,
    passingGrade: quiz.passingGrade,
    randomizeOrder: quiz.randomizeOrder,
    maxQuestions: quiz.maxQuestions || undefined,
    featuredImageUrl: quiz.featuredImageUrl || '',
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      points: q.points,
      explanation: q.explanation || '',
      timeLimit: q.timeLimit || undefined,
      order: q.order,
      answers: q.answers
        .sort((a, b) => a.order - b.order)
        .map((a) => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect,
          explanation: a.explanation || '',
          order: a.order,
        })),
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Modifier le quiz
        </h1>
        <p className="text-gray-600">Modifiez les informations du quiz</p>
      </div>
      <QuizForm initialData={quizData} />
    </div>
  );
}
