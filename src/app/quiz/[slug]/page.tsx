import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getQuizBySlug } from '@/lib/wordpress';
import { getAllQuizSlugs } from '@/lib/quiz-service';
import QuizPlayer from '@/components/Quiz/QuizPlayer';
import QuizSchema from '@/components/SEO/QuizSchema';
import BreadcrumbSchema from '@/components/SEO/BreadcrumbSchema';
import DisplayAd from '@/components/Ads/DisplayAd';
import InArticleAd from '@/components/Ads/InArticleAd';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { stripHtml, formatDuration } from '@/lib/utils';

export const revalidate = 3600; // Revalider toutes les heures

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllQuizSlugs();
    if (slugs.length > 0) {
      return slugs.map((slug) => ({
        slug,
      }));
    }
  } catch (error) {
    // Si WordPress n'est pas accessible, retourner un slug par défaut
    // pour permettre le build
    console.warn('Erreur lors de la récupération des slugs pour generateStaticParams:', error);
  }
  // Retourner au moins un slug par défaut pour permettre le build
  return [{ slug: 'mini-exam' }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const quiz = await getQuizBySlug(params.slug);

  if (!quiz) {
    return {
      title: 'Quiz Not Found',
    };
  }

  const title = stripHtml(quiz.title.rendered);
  const description = stripHtml(quiz.excerpt?.rendered || quiz.content.rendered);
  const image = quiz.featured_media_url || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
      type: 'article',
      url: `${SITE_URL}/quiz/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function QuizPage({ params }: PageProps) {
  const quiz = await getQuizBySlug(params.slug);

  if (!quiz) {
    notFound();
  }

  const title = stripHtml(quiz.title.rendered);
  const description = stripHtml(quiz.excerpt?.rendered || '');
  const difficulty = quiz.acf?.niveau_difficulte || 'Medium';
  const duration = quiz.acf?.duree_estimee || 10;
  const questionCount = quiz.acf?.nombre_questions || 0;

  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Quizzes', url: `${SITE_URL}/quiz` },
    { name: title, url: `${SITE_URL}/quiz/${params.slug}` },
  ];

  return (
    <>
      <QuizSchema quiz={quiz} />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* En-tête du quiz moderne */}
          <div className="mb-12">
            {quiz.featured_media_url && (
              <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-xl">
                <Image
                  src={quiz.featured_media_url}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                    {title}
                  </h1>
                </div>
              </div>
            )}

            {!quiz.featured_media_url && (
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                  {title}
                </h1>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200">
              {description && (
                <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">{description}</p>
              )}

              {/* Métadonnées modernisées */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Duration</div>
                    <div className="text-sm font-bold text-gray-900">{formatDuration(duration)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Questions</div>
                    <div className="text-sm font-bold text-gray-900">{questionCount}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Level</div>
                    <div className="text-sm font-bold text-gray-900">{difficulty}</div>
                  </div>
                </div>

                {quiz.acf?.categorie && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Category</div>
                      <div className="text-sm font-bold text-gray-900">{quiz.acf.categorie}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Publicité */}
        <DisplayAd />

        {/* Lecteur de quiz */}
        <QuizPlayer quiz={quiz} />

        {/* Publicité dans l'article */}
        <InArticleAd />
        </div>
      </div>
    </>
  );
}

