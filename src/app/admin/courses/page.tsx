import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeleteCourseButton from '@/components/Admin/DeleteCourseButton';
import PublishCourseButton from '@/components/Admin/PublishCourseButton';
import PublishCourseToFreeButton from '@/components/Admin/PublishCourseToFreeButton';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';
import CourseModulesDraggable from '@/components/Admin/CourseModulesDraggable';

function filterPillClass(active: boolean) {
  return active
    ? 'rounded-lg bg-[#f5c14a] px-3 py-1.5 text-sm font-semibold text-[#0c0a00] transition-colors'
    : 'rounded-lg border border-white/15 bg-[#0e0e1a] px-3 py-1.5 text-sm font-medium text-[rgba(238,234,244,0.75)] transition-colors hover:border-[#f5c14a]/40 hover:text-[#f5c14a]';
}

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
      <div className="admin-courses space-y-6 text-[#eeeaf4]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
              Course Management
            </h1>
            <p className="text-[rgba(238,234,244,0.55)]">
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
                className={filterPillClass(
                  !statusFilter || (statusFilter !== 'published' && statusFilter !== 'draft')
                )}
              >
                All
              </Link>
              <Link
                href="/admin/courses?status=published"
                className={filterPillClass(statusFilter === 'published')}
              >
                Published only
              </Link>
              <Link
                href="/admin/courses?status=draft"
                className={filterPillClass(statusFilter === 'draft')}
              >
                Drafts only
              </Link>
            </div>
          </div>
          <Link
            href="/admin/courses/new"
            className="rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] shadow-[0_4px_20px_rgba(245,193,74,0.2)] transition-colors hover:bg-[#f9d06a]"
          >
            + New Course
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="space-y-6">
            {courses.map((course) => {
              const totalQuizzesInCourse = course.modules.reduce(
                (acc, module) => acc + module._count.quizzes,
                0
              );

              return (
                <div
                  key={course.id}
                  className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-6 shadow-lg"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-[#eeeaf4]">{course.title}</h2>
                        <span className="rounded-full border border-[#b388ff]/30 bg-[#b388ff]/15 px-3 py-1 text-xs font-medium text-[#d4b8ff]">
                          {course._count.modules} module{course._count.modules !== 1 ? 's' : ''}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            course.status === 'published'
                              ? 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                              : 'border border-white/15 bg-white/5 text-[rgba(238,234,244,0.65)]'
                          }`}
                        >
                          {course.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {course.description && (
                        <SafeHtmlRenderer
                          html={course.description}
                          className="prose prose-sm mb-2 max-w-none text-[rgba(238,234,244,0.65)] prose-invert prose-p:text-[rgba(238,234,244,0.65)]"
                        />
                      )}
                      <code className="rounded border border-white/10 bg-[#0e0e1a] px-2 py-1 text-xs text-[rgba(238,234,244,0.55)]">
                        {course.slug}
                      </code>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {course.status !== 'published' && (
                        <Link
                          href={`/quiz/course/${encodeURIComponent(course.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
                        >
                          Preview
                        </Link>
                      )}
                      <PublishCourseButton
                        courseId={course.id}
                        courseTitle={course.title}
                        currentStatus={(course.status as 'published' | 'draft') || 'draft'}
                      />
                      <PublishCourseToFreeButton
                        courseId={course.id}
                        courseTitle={course.title}
                        totalQuizzes={totalQuizzesInCourse}
                      />
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/modules?courseId=${course.id}`}
                        className="rounded-lg border border-[#b388ff]/35 bg-[#b388ff]/15 px-4 py-2 text-sm font-medium text-[#d4b8ff] transition-colors hover:bg-[#b388ff]/25"
                      >
                        Modules
                      </Link>
                      <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                    </div>
                  </div>

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
                        className="mt-3 inline-block text-sm font-medium text-[#f5c14a] hover:text-[#f9d06a]"
                      >
                        + Add a module
                      </Link>
                    </>
                  ) : (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <Link
                        href={`/admin/modules/new?courseId=${course.id}`}
                        className="text-sm font-medium text-[#f5c14a] hover:text-[#f9d06a]"
                      >
                        + Add a module
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-12 text-center shadow-lg">
            <div className="mb-4 text-6xl">📚</div>
            <h3 className="mb-2 text-2xl font-bold text-[#eeeaf4]">
              {statusFilter === 'draft'
                ? 'No draft courses'
                : statusFilter === 'published'
                  ? 'No published courses'
                  : 'No courses'}
            </h3>
            <p className="mb-6 text-[rgba(238,234,244,0.55)]">
              {statusFilter === 'draft' || statusFilter === 'published' ? (
                <>
                  <Link href="/admin/courses" className="font-medium text-[#f5c14a] hover:underline">
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
              className="inline-block rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
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
      <div className="space-y-6 text-[#eeeaf4]">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-[#eeeaf4]">Course Management</h1>
        </div>
        <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-200">Connection Error</h2>
          <p className="mb-4 text-red-200/80">
            Unable to connect to the database. Please check your configuration.
          </p>
          <details className="text-sm text-red-200/70">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <pre className="mt-2 overflow-auto rounded border border-red-500/30 bg-[#0e0e1a] p-2">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
