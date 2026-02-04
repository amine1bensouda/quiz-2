import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuizByCategory } from '@/lib/wordpress';
import { getAllCategories } from '@/lib/quiz-service';
import QuizCard from '@/components/Quiz/QuizCard';
import Navigation from '@/components/Layout/Navigation';
import DisplayAd from '@/components/Ads/DisplayAd';
import { SITE_NAME } from '@/lib/constants';

export const revalidate = 3600; // Revalider toutes les heures

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories();
    if (categories.length > 0) {
      return categories.map((category) => ({
        slug: category.slug,
      }));
    }
  } catch (error) {
    // Si WordPress n'est pas accessible, continuer avec les valeurs par défaut
    console.warn('Erreur lors de la récupération des catégories pour generateStaticParams:', error);
  }
  // Retourner des catégories par défaut pour permettre le build
  return [
    { slug: 'all' },
    { slug: 'sat-test' },
    { slug: 'act-test' },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categories = await getAllCategories();
  const category = categories.find((cat) => cat.slug === params.slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} Quizzes`,
    description: `Discover all our quizzes on the topic of ${category.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const [quizs, categories] = await Promise.all([
    getQuizByCategory(params.slug),
    getAllCategories(),
  ]);

  const category = categories.find((cat) => cat.slug === params.slug);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 animate-fade-in">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-blue-100 border border-primary-200 mb-4">
            <span className="text-sm font-semibold text-primary-700">Category</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 gradient-text">
            {category.name} Quizzes
          </h1>
          {category.description && (
            <p className="text-xl text-gray-600 mb-4 leading-relaxed max-w-3xl">{category.description}</p>
          )}
          <p className="text-lg text-gray-500">
            {quizs.length} quiz{quizs.length !== 1 ? 'zes' : ''} available
          </p>
        </div>

        {/* Publicité */}
        <DisplayAd />

        {quizs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quizs.map((quiz, index) => (
              <QuizCard key={quiz.id} quiz={quiz} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card-modern">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600 text-lg">
              No quizzes available in this category at the moment.
            </p>
          </div>
        )}

        {/* Publicité */}
        <DisplayAd />
      </div>
    </div>
  );
}

