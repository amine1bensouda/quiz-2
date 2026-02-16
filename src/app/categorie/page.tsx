import Link from 'next/link';
import { getAllCategories } from '@/lib/quiz-service';
import Navigation from '@/components/Layout/Navigation';
import { SITE_NAME } from '@/lib/constants';

export const revalidate = 3600;

export const metadata = {
  title: 'Categories',
  description: `Browse quiz categories on ${SITE_NAME}`,
};

export default async function CategoriesListPage() {
  let categories: { slug: string; name: string; description?: string }[] = [];
  try {
    categories = await getAllCategories();
  } catch (error) {
    console.warn('Erreur lors de la récupération des catégories:', error);
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 animate-fade-in">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-blue-100 border border-primary-200 mb-4">
            <span className="text-sm font-semibold text-primary-700">Categories</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 gradient-text">
            Quiz Categories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Choose a category to explore quizzes
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categorie/${category.slug}`}
                className="block p-6 rounded-2xl border border-gray-200 bg-white hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h2>
                {category.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{category.description}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-gray-200 bg-gray-50">
            <p className="text-gray-600">No categories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
