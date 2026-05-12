import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeleteCourseButton from '@/components/Admin/DeleteCourseButton';
import PublishCourseButton from '@/components/Admin/PublishCourseButton';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';
import CourseModulesDraggable from '@/components/Admin/CourseModulesDraggable';

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  try {
    const statusFilter = searchParams?.status;
    const where =
      statusFilter === 'published' || statusFilter === 'draft'
        ? { status: statusFilter }
        : {};

    const courses = await prisma.course.findMany({
    where,
    include: {
      modules: {
        include: {
          _count: {
            select: {
              quizzes: true,
              lessons: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          modules: true,
        },
      },
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });

    const draftCount = courses.filter((c) => c.status !== 'published').length;
    const publishedCount = courses.filter((c) => c.status === 'published').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Course Management
          </h1>
          <p className="text-gray-600">
            {courses.length} course{courses.length !== 1 ? 's' : ''} shown
            {!statusFilter || (statusFilter !== 'published' && statusFilter !== 'draft') ? (
              <>
                {' '}
                · {publishedCount} published · {draftCount} draft{draftCount !== 1 ? 's' : ''}
              </>
            ) : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/admin/courses"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                !statusFilter || (statusFilter !== 'published' && statusFilter !== 'draft')
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </Link>
            <Link
              href="/admin/courses?status=published"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'published'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published only
            </Link>
            <Link
              href="/admin/courses?status=draft"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'draft'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Drafts only
            </Link>
          </div>
        </div>
        <Link
          href="/admin/courses/new"
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
        >
          ➕ New Course
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="space-y-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {course._count.modules} module{course._count.modules !== 1 ? 's' : ''}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.status === 'published' ? '✅ Published' : '📝 Draft'}
                    </span>
                  </div>
                  {course.description && (
                    <SafeHtmlRenderer 
                      html={course.description}
                      className="text-gray-600 mb-2 prose prose-sm max-w-none"
                    />
                  )}
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {course.slug}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  {course.status !== 'published' && (
                    <Link
                      href={`/quiz/course/${encodeURIComponent(course.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors text-sm font-medium"
                    >
                      Prévisualiser
                    </Link>
                  )}
                  <PublishCourseButton
                    courseId={course.id}
                    courseTitle={course.title}
                    currentStatus={(course.status as 'published' | 'draft') || 'draft'}
                  />
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/modules?courseId=${course.id}`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Modules
                  </Link>
                  <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                </div>
              </div>

              {/* Course Modules (glisser-déposer pour réordonner) */}
              {course.modules.length > 0 ? (
                <>
                  <CourseModulesDraggable
                    courseId={course.id}
                    modules={course.modules.map((m) => ({
                      id: m.id,
                      title: m.title,
                      _count: m._count,
                    }))}
                  />
                  <Link
                    href={`/admin/modules/new?courseId=${course.id}`}
                    className="mt-3 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    ➕ Add a module
                  </Link>
                </>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href={`/admin/modules/new?courseId=${course.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    ➕ Add a module
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {statusFilter === 'draft'
              ? 'No draft courses'
              : statusFilter === 'published'
                ? 'No published courses'
                : 'No courses'}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'draft' || statusFilter === 'published' ? (
              <>
                <Link href="/admin/courses" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Show all courses
                </Link>
                {' · '}
              </>
            ) : null}
            {statusFilter === 'draft' || statusFilter === 'published'
              ? 'Try another filter or create a course.'
              : 'Start by creating your first course'}
          </p>
          <Link
            href="/admin/courses/new"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            Create a course
          </Link>
        </div>
      )}
    </div>
  );
  } catch (error: any) {
    console.error('AdminCoursesPage:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Course Management
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">
            Unable to connect to the database. Please check your configuration.
          </p>
          <details className="text-sm text-red-700">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">{error.message}</pre>
          </details>
        </div>
      </div>
    );
  }
}
