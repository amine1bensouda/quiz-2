import Link from 'next/link';
import { getPublishedCoursesSummary } from '@/lib/course-service';
import Navigation from '@/components/Layout/Navigation';
import { SITE_NAME } from '@/lib/constants';
import { excerptFromHtml } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata = {
  title: 'Courses',
  description: `Browse courses on ${SITE_NAME}`,
};

export default async function CategoriesListPage() {
  let courses: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    moduleCount?: number;
    totalQuizzes?: number;
  }[] = [];
  try {
    courses = await getPublishedCoursesSummary();
  } catch (error) {
    console.warn('Could not load courses:', error);
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 animate-fade-in">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-blue-100 border border-primary-200 mb-4">
            <span className="text-sm font-semibold text-primary-700">Courses</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 gradient-text">
            All Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Choose a course to start practicing
          </p>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/quiz/course/${course.slug}`}
                className="block p-6 rounded-2xl border border-gray-200 bg-white hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
                {course.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {excerptFromHtml(course.description, 140)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-gray-200 bg-gray-50">
            <p className="text-gray-600">No courses available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
