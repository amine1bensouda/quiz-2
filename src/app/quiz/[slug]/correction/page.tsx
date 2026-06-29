import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuizBySlug } from '@/lib/wordpress';
import QuizCorrection from '@/components/Quiz/QuizCorrection';
import { SITE_URL } from '@/lib/constants';
import { stripHtml } from '@/lib/utils';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export const revalidate = 3600;

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
  const description = `Quiz answer key: ${title}`;

  return {
    title: `Answer key — ${title}`,
    description,
    openGraph: {
      title: `Answer key — ${title}`,
      description,
      type: 'article',
      url: `${SITE_URL}/quiz/${params.slug}/correction`,
    },
  };
}

export default async function QuizCorrectionPage({ params }: PageProps) {
  const isAdmin = await isAdminAuthenticated();
  const quiz = await getQuizBySlug(params.slug, { allowDraftCourse: isAdmin });

  if (!quiz) {
    notFound();
  }

  return (
    <div className="quiz-page quiz-correction-page min-h-screen bg-[#080810] text-[#eeeaf4]">
      <div className="container relative z-10 mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="mb-2 font-['Instrument_Serif',serif] text-3xl font-bold text-[#f5f2ff] md:text-4xl">
            Answer key
          </h1>
          <p className="text-lg text-[#a29cb0]">
            {stripHtml(quiz.title.rendered)}
          </p>
        </div>

        <QuizCorrection quiz={quiz} />
      </div>
    </div>
  );
}
