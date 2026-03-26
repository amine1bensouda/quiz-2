import { prisma } from '@/lib/db';
import { isSafeModeEnabled } from '@/lib/runtime-flags';

type AdminCountRow = {
  quiz_count: bigint;
  question_count: bigint;
  module_count: bigint;
  lesson_count: bigint;
  blog_count: bigint;
};

export default async function AdminDashboard() {
  try {
    const safeMode = isSafeModeEnabled();
    let usedFallback = false;
    const safe = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
      if (safeMode) {
        usedFallback = true;
        return fallback;
      }
      try {
        return await fn();
      } catch (error) {
        console.error(`AdminDashboard ${label} fallback:`, error);
        usedFallback = true;
        return fallback;
      }
    };

    // Tolérant: si Supabase pool timeout, on n'affiche pas une erreur bloquante.
    const countRows = await safe<AdminCountRow[]>(
      'counts',
      () => prisma.$queryRaw<AdminCountRow[]>`
        SELECT
          (SELECT COUNT(*) FROM quizzes) AS quiz_count,
          (SELECT COUNT(*) FROM questions) AS question_count,
          (SELECT COUNT(*) FROM modules) AS module_count,
          (SELECT COUNT(*) FROM lessons) AS lesson_count,
          (SELECT COUNT(*) FROM blog_posts) AS blog_count
      `,
      []
    );
    const c = countRows[0];
    const quizCount = Number(c?.quiz_count ?? 0);
    const questionCount = Number(c?.question_count ?? 0);
    const moduleCount = Number(c?.module_count ?? 0);
    const lessonCount = Number(c?.lesson_count ?? 0);
    const blogCount = Number(c?.blog_count ?? 0);

    const allQuizzes = await safe(
      'recent quizzes',
      () =>
        prisma.quiz.findMany({
          take: 5,
          include: {
            module: {
              include: {
                course: true,
              },
            },
            _count: {
              select: {
                questions: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      []
    );

    const recentBlogs = await safe(
      'recent blogs',
      () =>
        prisma.blogPost.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, slug: true, status: true, createdAt: true },
        }),
      []
    );

    const recentLessons = await safe(
      'recent lessons',
      () =>
        prisma.lesson.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        }),
      []
    );

    // Convertir les quiz Prisma au format attendu
    const quizzes = allQuizzes.map((q) => ({
      id: q.id,
      title: q.title,
      slug: q.slug,
      acf: {
        nombre_questions: q._count?.questions || 0,
      },
    }));

  const stats = [
    { label: 'Total Quiz', value: quizCount, icon: '📝', color: 'from-indigo-500 to-purple-500' },
    { label: 'Total Questions', value: questionCount, icon: '❓', color: 'from-purple-500 to-pink-500' },
    { label: 'Modules', value: moduleCount, icon: '📚', color: 'from-pink-500 to-rose-500' },
    { label: 'Lessons', value: lessonCount, icon: '📄', color: 'from-sky-500 to-cyan-500' },
    { label: 'Blog Posts', value: blogCount, icon: '📰', color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">Manage your quizzes and questions</p>
      </div>
      {usedFallback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Donnees partielles affichees : la base est temporairement indisponible ou SAFE_MODE est actif.
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz récents */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Quizzes</h2>
          <a
            href="/admin/quizzes/new"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            ➕ New Quiz
          </a>
        </div>

        {quizzes.length > 0 ? (
          <div className="space-y-4">
            {quizzes.slice(0, 5).map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {quiz.title || 'No title'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Slug: {quiz.slug}
                  </p>
                </div>
                <a
                  href={`/admin/quizzes/${quiz.id}/edit`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Edit
                </a>
              </div>
            ))}
            {quizzes.length > 5 && (
              <a
                href="/admin/quizzes"
                className="block text-center text-indigo-600 hover:text-indigo-800 font-medium py-2"
              >
                View all quizzes ({quizzes.length}) →
              </a>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No quizzes yet</p>
            <a
              href="/admin/quizzes/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
            >
              Create your first quiz
            </a>
          </div>
        )}
      </div>
      {/* Lessons récents */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Lessons</h2>
          <a
            href="/admin/lessons/new"
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-lg hover:from-sky-700 hover:to-cyan-700 transition-all font-medium"
          >
            + New Lesson
          </a>
        </div>

        {recentLessons.length > 0 ? (
          <div className="space-y-4">
            {recentLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{lesson.title || 'Untitled lesson'}</h3>
                  <p className="text-sm text-gray-600">
                    {lesson.module
                      ? `${lesson.module.course.title} / ${lesson.module.title}`
                      : 'Independent lesson'}
                  </p>
                </div>
                <a
                  href={`/admin/lessons/${lesson.id}/edit`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Edit
                </a>
              </div>
            ))}
            <a
              href="/admin/lessons"
              className="block text-center text-indigo-600 hover:text-indigo-800 font-medium py-2"
            >
              View all lessons ({lessonCount}) →
            </a>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No lessons yet</p>
            <a
              href="/admin/lessons/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-lg hover:from-sky-700 hover:to-cyan-700 transition-all font-medium"
            >
              Create your first lesson
            </a>
          </div>
        )}
      </div>
      {/* Blogs récents */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Posts</h2>
          <a
            href="/admin/blogs/new"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
          >
            + New Post
          </a>
        </div>

        {recentBlogs.length > 0 ? (
          <div className="space-y-4">
            {recentBlogs.map((blog) => (
              <div
                key={blog.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {blog.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {blog.slug}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      blog.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {blog.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <a
                  href={`/admin/blogs/${blog.id}/edit`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Edit
                </a>
              </div>
            ))}
            <a
              href="/admin/blogs"
              className="block text-center text-indigo-600 hover:text-indigo-800 font-medium py-2"
            >
              View all posts ({blogCount}) →
            </a>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Aucun article de blog</p>
            <a
              href="/admin/blogs/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
            >
              Create your first post
            </a>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error: any) {
    console.error('Erreur AdminDashboard:', error);
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">Manage your quizzes and questions</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">
            Unable to connect to the database. Please check your configuration.
          </p>
          <details className="text-sm text-red-700">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">{error.message}</pre>
          </details>
        </div>
      </div>
    );
  }
}
