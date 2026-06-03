import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeleteModuleButton from '@/components/Admin/DeleteModuleButton';
import ModuleTableWithReorder from '@/components/Admin/ModuleTableWithReorder';

const adminModuleInclude = {
  course: true,
  _count: {
    select: {
      quizzes: true,
    },
  },
} satisfies Prisma.ModuleInclude;

type AdminModuleWithCourse = Prisma.ModuleGetPayload<{ include: typeof adminModuleInclude }>;

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: { courseId?: string };
}) {
  const where = searchParams.courseId ? { courseId: searchParams.courseId } : {};

  let modules: AdminModuleWithCourse[] = [];
  let courses: Awaited<ReturnType<typeof prisma.course.findMany>> = [];
  let dbError: string | null = null;

  try {
    modules = await prisma.module.findMany({
      where,
      include: adminModuleInclude,
      orderBy: [
        { course: { title: 'asc' } },
        { order: 'asc' },
      ],
    });

    courses = searchParams.courseId
      ? []
      : await prisma.course.findMany({
          orderBy: [{ status: 'asc' }, { title: 'asc' }],
        });
  } catch (e) {
    console.error('AdminModulesPage:', e);
    const msg = e instanceof Error ? e.message : 'Database error';
    dbError = msg.includes('ENOTFOUND') || msg.includes('tenant/user')
      ? 'PostgreSQL refused the connection (project or user not found). Check DATABASE_URL / DIRECT_URL in .env (e.g. Supabase: active project, password, session vs transaction pooler mode).'
      : `Could not load modules: ${msg}`;
  }

  if (dbError) {
    return (
      <div className="admin-app space-y-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-[#eeeaf4]">
        <h1 className="text-2xl font-bold text-red-200">Modules — database unavailable</h1>
        <p className="text-red-100/90">{dbError}</p>
        <p className="text-sm text-[rgba(238,234,244,0.65)]">
          Fix the connection and reload. Locally, PostgreSQL (Docker or similar) with a valid URL also works.
        </p>
        <Link href="/admin" className="inline-block text-sm font-semibold text-[#f5c14a] hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const filterPill = (active: boolean) =>
    active
      ? 'rounded-lg bg-[#f5c14a] px-3 py-1.5 text-sm font-semibold text-[#0c0a00]'
      : 'rounded-lg border border-white/15 bg-[#0e0e1a] px-3 py-1.5 text-sm font-medium text-[rgba(238,234,244,0.75)] transition-colors hover:border-[#f5c14a]/40 hover:text-[#f5c14a]';

  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">Module Management</h1>
          <p className="text-[rgba(238,234,244,0.55)]">
            {modules.length} module{modules.length !== 1 ? 's' : ''} total
            {searchParams.courseId && ' for this course'}
          </p>
        </div>
        <Link
          href={searchParams.courseId ? `/admin/modules/new?courseId=${searchParams.courseId}` : '/admin/modules/new'}
          className="rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] shadow-[0_4px_20px_rgba(245,193,74,0.2)] transition-colors hover:bg-[#f9d06a]"
        >
          + New Module
        </Link>
      </div>

      {courses.length > 0 && (
        <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-4 shadow-lg">
          <p className="mb-2 text-sm font-medium text-[rgba(238,234,244,0.75)]">Filter by course:</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/modules" className={filterPill(!searchParams.courseId)}>
              All
            </Link>
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/modules?courseId=${course.id}`}
                className={filterPill(searchParams.courseId === course.id)}
              >
                {course.title}
                {course.status !== 'published' ? (
                  <span
                    className={
                      searchParams.courseId === course.id
                        ? 'ml-1 font-normal text-[#0c0a00]/70'
                        : 'ml-1 text-amber-300/90'
                    }
                  >
                    (draft)
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      )}

      {modules.length > 0 ? (
        searchParams.courseId ? (
          <>
            <p className="mb-3 text-sm text-[rgba(238,234,244,0.55)]">
              Use the <span className="inline-block align-middle">↑</span> <span className="inline-block align-middle">↓</span> arrows to change module order.
            </p>
            <ModuleTableWithReorder
            modules={modules.map((m) => ({
              id: m.id,
              title: m.title,
              slug: m.slug,
              description: m.description,
              order: m.order,
              course: m.course,
              _count: m._count,
            }))}
            courseId={searchParams.courseId}
          />
          </>
        ) : (
          <div className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10 bg-[#0e0e1a]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                      Slug
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                      Quiz
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {modules.map((module) => (
                    <tr key={module.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#eeeaf4]">{module.title}</div>
                        {module.description && (
                          <div className="mt-1 line-clamp-1 text-sm text-[rgba(238,234,244,0.45)]">
                            {module.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-[#b388ff]/30 bg-[#b388ff]/15 px-3 py-1 text-xs font-medium text-[#d4b8ff]">
                          {module.course.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded border border-white/10 bg-[#0e0e1a] px-2 py-1 text-xs text-[rgba(238,234,244,0.55)]">
                          {module.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-[rgba(238,234,244,0.75)]">
                        {module._count.quizzes}
                      </td>
                      <td className="px-6 py-4 text-[rgba(238,234,244,0.75)]">
                        {module.order}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/modules/${module.id}/edit`}
                            className="rounded-lg border border-white/15 px-3 py-1 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                          >
                            Edit
                          </Link>
                          <DeleteModuleButton moduleId={module.id} moduleTitle={module.title} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-12 text-center shadow-lg">
          <div className="mb-4 text-6xl">📦</div>
          <h3 className="mb-2 text-2xl font-bold text-[#eeeaf4]">No modules</h3>
          <p className="mb-6 text-[rgba(238,234,244,0.55)]">Start by creating your first module</p>
          <Link
            href={searchParams.courseId ? `/admin/modules/new?courseId=${searchParams.courseId}` : '/admin/modules/new'}
            className="inline-block rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
          >
            Create a module
          </Link>
        </div>
      )}
    </div>
  );
}
