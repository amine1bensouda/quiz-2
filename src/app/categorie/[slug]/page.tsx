import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllCategories, getCoursesByCategorySlug } from '@/lib/quiz-service';
import type { Category } from '@/lib/types';
import CourseCard from '@/components/Quiz/CourseCard';
import Navigation from '@/components/Layout/Navigation';

export const revalidate = 3600;

interface PageProps {
  params: {
    slug: string;
  };
}

function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function findCategoryBySlug(categories: Category[], slugParam: string) {
  const decoded = decodeURIComponent(slugParam || '');
  const exact = categories.find((c) => c.slug === decoded);
  if (exact) return exact;
  const normalized = normalizeSlug(decoded);
  const bySlug = categories.find((c) => normalizeSlug(c.slug) === normalized);
  if (bySlug) return bySlug;
  const byName = categories.find((c) => normalizeSlug(c.name) === normalized || c.name.toLowerCase() === decoded.toLowerCase());
  return byName ?? null;
}

// Toujours [] pour éviter des centaines de pages au build → épuisement du pool PostgreSQL (Hostinger/Supabase)
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categories = await getAllCategories();
  const category = findCategoryBySlug(categories, params.slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} Courses`,
    description: `Discover all our courses on the topic of ${category.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const categories = await getAllCategories();
  const category = findCategoryBySlug(categories, params.slug);

  if (!category) {
    notFound();
  }

  const courses = await getCoursesByCategorySlug(category.slug);

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
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                moduleCount={course.moduleCount}
                totalQuizzes={course.totalQuizzes}
                slug={course.slug}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card-modern">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600 text-lg">
              No courses available in this category at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

