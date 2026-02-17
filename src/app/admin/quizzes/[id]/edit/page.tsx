import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import QuizForm from '@/components/Admin/QuizForm';

const quizInclude = {
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
      order: 'asc' as const,
    },
  },
};

export default async function EditQuizPage({ params }: { params: { id: string } }) {
  const rawId = typeof params.id === 'string' ? params.id : '';
  const decodedId = decodeURIComponent(rawId);

  // Essayer d'abord par ID (cuid)
  let quiz = await prisma.quiz.findUnique({
    where: { id: decodedId },
    include: quizInclude,
  });

  // Si pas trouvé par ID, essayer par slug (exact puis variantes)
  if (!quiz) {
    quiz = await prisma.quiz.findUnique({
      where: { slug: decodedId },
      include: quizInclude,
    });
  }
  if (!quiz && decodedId.includes(' ')) {
    const slugWithHyphens = decodedId.replace(/\s+/g, '-');
    quiz = await prisma.quiz.findFirst({
      where: { slug: slugWithHyphens },
      include: quizInclude,
    });
  }
  if (!quiz) {
    const normalizedSlug = decodedId.replace(/\s+/g, '-').toLowerCase();
    quiz = await prisma.quiz.findFirst({
      where: { slug: normalizedSlug },
      include: quizInclude,
    });
  }

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
    // Normaliser la difficulté : utiliser '' quand la valeur est null
    difficulty: quiz.difficulty ?? '',
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
          Edit Quiz
        </h1>
        <p className="text-gray-600">Modify quiz information</p>
      </div>
      <QuizForm initialData={quizData} />
    </div>
  );
}
