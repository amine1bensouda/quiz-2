import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuizBySlug } from '@/lib/wordpress';
import QuizCorrection from '@/components/Quiz/QuizCorrection';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { stripHtml } from '@/lib/utils';

export const revalidate = 3600; // Revalider toutes les heures

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const quiz = await getQuizBySlug(params.slug);

  if (!quiz) {
    return {
      title: 'Quiz Not Found',
    };
  }

  const title = stripHtml(quiz.title.rendered);
  const description = `Correction du quiz: ${title}`;

  return {
    title: `Correction - ${title}`,
    description,
    openGraph: {
      title: `Correction - ${title}`,
      description,
      type: 'article',
      url: `${SITE_URL}/quiz/${params.slug}/correction`,
    },
  };
}

export default async function QuizCorrectionPage({ params }: PageProps) {
  const quiz = await getQuizBySlug(params.slug);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="bg-gradient-to-b from-white via-gray-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Quiz Correction
          </h1>
          <p className="text-lg text-gray-600">
            {stripHtml(quiz.title.rendered)}
          </p>
        </div>

        <QuizCorrection quiz={quiz} />
      </div>
    </div>
  );
}
