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
    { label: 'Quiz', value: quizCount, icon: '📝' },
    { label: 'Questions', value: questionCount, icon: '❓' },
    { label: 'Modules', value: moduleCount, icon: '📚' },
    { label: 'Lessons', value: lessonCount, icon: '📄' },
    { label: 'Blog posts', value: blogCount, icon: '📰' },
  ];

  return (
    <div className="admin-dashboard space-y-8 text-[#eeeaf4]">
      <div className="admin-dashboard-intro">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
          Dashboard
        </h1>
        <p className="text-[rgba(238,234,244,0.55)]">Manage quizzes, courses, and content.</p>
      </div>
      {usedFallback && (
        <div className="admin-dashboard-alert rounded-xl border border-[#f5c14a]/40 bg-[#f5c14a]/10 px-4 py-3 text-sm text-[#fff7e0]">
          Showing partial data: the database is temporarily unavailable or SAFE_MODE is enabled.
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-6 shadow-lg transition-shadow hover:border-[#f5c14a]/25 hover:shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-sm font-medium text-[rgba(238,234,244,0.55)]">{stat.label}</p>
                <p className="text-3xl font-bold text-[#f5c14a]">{stat.value}</p>
              </div>
              <div className="text-4xl opacity-90">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent quizzes */}
      <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-6 shadow-lg">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-[#eeeaf4]">Recent quizzes</h2>
          <a
            href="/admin/quizzes/new"
            className="rounded-full bg-[#f5c14a] px-4 py-2 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
          >
            + New quiz
          </a>
        </div>

        {quizzes.length > 0 ? (
          <div className="space-y-4">
            {quizzes.slice(0, 5).map((quiz) => (
              <div
                key={quiz.id}
                className="admin-row flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0e0e1a] p-4 transition-colors hover:border-white/15"
              >
                <div>
                  <h3 className="font-semibold text-[#eeeaf4]">{quiz.title || 'Untitled'}</h3>
                  <p className="text-sm text-[rgba(238,234,244,0.5)]">Slug: {quiz.slug}</p>
                </div>
                <a
                  href={`/admin/quizzes/${quiz.id}/edit`}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                >
                  Edit
                </a>
              </div>
            ))}
            {quizzes.length > 5 && (
              <a
                href="/admin/quizzes"
                className="block py-2 text-center text-sm font-semibold text-[#f5c14a] hover:underline"
              >
                View all quizzes ({quizzes.length}) →
              </a>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-[rgba(238,234,244,0.55)]">No quizzes yet</p>
            <a
              href="/admin/quizzes/new"
              className="inline-block rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
            >
              Create a quiz
            </a>
          </div>
        )}
      </div>
      {/* Recent lessons */}
      <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-6 shadow-lg">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-[#eeeaf4]">Recent lessons</h2>
          <a
            href="/admin/lessons/new"
            className="admin-btn-secondary rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
          >
            + New lesson
          </a>
        </div>

        {recentLessons.length > 0 ? (
          <div className="space-y-4">
            {recentLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="admin-row flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0e0e1a] p-4 transition-colors hover:border-white/15"
              >
                <div>
                  <h3 className="font-semibold text-[#eeeaf4]">{lesson.title || 'Untitled'}</h3>
                  <p className="text-sm text-[rgba(238,234,244,0.5)]">
                    {lesson.module
                      ? `${lesson.module.course.title} / ${lesson.module.title}`
                      : 'Standalone lesson'}
                  </p>
                </div>
                <a
                  href={`/admin/lessons/${lesson.id}/edit`}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                >
                  Edit
                </a>
              </div>
            ))}
            <a
              href="/admin/lessons"
              className="block py-2 text-center text-sm font-semibold text-[#f5c14a] hover:underline"
            >
              View all lessons ({lessonCount}) →
            </a>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-[rgba(238,234,244,0.55)]">No lessons yet</p>
            <a
              href="/admin/lessons/new"
              className="admin-btn-secondary inline-block rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
            >
              Create a lesson
            </a>
          </div>
        )}
      </div>
      {/* Recent blog posts */}
      <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-6 shadow-lg">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-[#eeeaf4]">Recent blog posts</h2>
          <a
            href="/admin/blogs/new"
            className="admin-btn-secondary rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
          >
            + New post
          </a>
        </div>

        {recentBlogs.length > 0 ? (
          <div className="space-y-4">
            {recentBlogs.map((blog) => (
              <div
                key={blog.id}
                className="admin-row flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0e0e1a] p-4 transition-colors hover:border-white/15"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-[#eeeaf4]">{blog.title || 'Untitled'}</h3>
                    <p className="text-sm text-[rgba(238,234,244,0.5)]">{blog.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      blog.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-white/10 text-[rgba(238,234,244,0.65)]'
                    }`}
                  >
                    {blog.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <a
                  href={`/admin/blogs/${blog.id}/edit`}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                >
                  Edit
                </a>
              </div>
            ))}
            <a
              href="/admin/blogs"
              className="block py-2 text-center text-sm font-semibold text-[#f5c14a] hover:underline"
            >
              View all posts ({blogCount}) →
            </a>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-[rgba(238,234,244,0.55)]">No blog posts yet</p>
            <a
              href="/admin/blogs/new"
              className="admin-btn-secondary inline-block rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
            >
              Create a post
            </a>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error: any) {
    console.error('AdminDashboard error:', error);
    return (
      <div className="admin-dashboard space-y-8 text-[#eeeaf4]">
        <div className="admin-dashboard-intro">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">Dashboard</h1>
          <p className="text-[rgba(238,234,244,0.55)]">Manage quizzes and content.</p>
        </div>
        <div className="admin-dashboard-error rounded-2xl border border-red-500/40 bg-red-500/10 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-200">Database connection error</h2>
          <p className="mb-4 text-red-100/90">
            Could not connect to the database. Check your configuration.
          </p>
          <details className="text-sm text-red-100/80">
            <summary className="cursor-pointer font-medium text-red-200">Details</summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-black/30 p-3 text-xs">{error.message}</pre>
          </details>
        </div>
      </div>
    );
  }
}
