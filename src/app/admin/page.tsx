import { getAllQuiz } from '@/lib/quiz-service';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function AdminDashboard() {
  try {
    // Tester la connexion d'abord avec une requête simple
    await prisma.$queryRaw`SELECT 1`;

    // Pour l'admin, on veut voir tous les quiz (pas seulement les publiés)
    const [allQuizzes, quizCount, questionCount, moduleCount, blogCount, recentBlogs] = await Promise.all([
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
      prisma.quiz.count(),
      prisma.question.count(),
      prisma.module.count(),
      prisma.blogPost.count(),
      prisma.blogPost.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, status: true, createdAt: true },
      }),
    ]);

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
    { label: 'Articles Blog', value: blogCount, icon: '📰', color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">Manage your quizzes and questions</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <Link
            href="/admin/quizzes/new"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            ➕ New Quiz
          </Link>
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
                <Link
                  href={`/admin/quizzes/${quiz.id}/edit`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Edit
                </Link>
              </div>
            ))}
            {quizzes.length > 5 && (
              <Link
                href="/admin/quizzes"
                className="block text-center text-indigo-600 hover:text-indigo-800 font-medium py-2"
              >
                View all quizzes ({quizzes.length}) →
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No quizzes yet</p>
            <Link
              href="/admin/quizzes/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
            >
              Create your first quiz
            </Link>
          </div>
        )}
      </div>
      {/* Blogs récents */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Articles récents</h2>
          <Link
            href="/admin/blogs/new"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
          >
            + Nouveau Blog
          </Link>
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
                      {blog.title || 'Sans titre'}
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
                    {blog.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <Link
                  href={`/admin/blogs/${blog.id}/edit`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Modifier
                </Link>
              </div>
            ))}
            <Link
              href="/admin/blogs"
              className="block text-center text-indigo-600 hover:text-indigo-800 font-medium py-2"
            >
              Voir tous les articles ({blogCount}) →
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Aucun article de blog</p>
            <Link
              href="/admin/blogs/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
            >
              Créer votre premier article
            </Link>
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
