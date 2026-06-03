import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeleteLessonButton from '@/components/Admin/DeleteLessonButton';

const filterPill = (active: boolean) =>
  active
    ? 'rounded-lg bg-[#f5c14a] px-3 py-1.5 text-sm font-semibold text-[#0c0a00]'
    : 'rounded-lg border border-white/15 bg-[#0e0e1a] px-3 py-1.5 text-sm font-medium text-[rgba(238,234,244,0.75)] transition-colors hover:border-[#f5c14a]/40 hover:text-[#f5c14a]';

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: { moduleId?: string };
}) {
  const where = searchParams.moduleId && searchParams.moduleId.trim() ? { moduleId: searchParams.moduleId.trim() } : {};

  const lessons = await prisma.lesson.findMany({
    where,
    include: {
      module: {
        include: {
          course: true,
        },
      },
    },
    orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
  });

  const modules = searchParams.moduleId
    ? []
    : await prisma.module.findMany({
        include: { course: true },
        orderBy: [{ course: { title: 'asc' } }, { order: 'asc' }],
      });

  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">Lesson Management</h1>
          <p className="text-[rgba(238,234,244,0.55)]">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total
            {searchParams.moduleId && ' in this module'}
          </p>
        </div>
        <Link
          href={searchParams.moduleId ? `/admin/lessons/new?moduleId=${searchParams.moduleId}` : '/admin/lessons/new'}
          className="rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] shadow-[0_4px_20px_rgba(245,193,74,0.2)] transition-colors hover:bg-[#f9d06a]"
        >
          + New Lesson
        </Link>
      </div>

      {modules.length > 0 && (
        <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-4 shadow-lg">
          <p className="mb-2 text-sm font-medium text-[rgba(238,234,244,0.75)]">Filter by module:</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/lessons" className={filterPill(!searchParams.moduleId)}>
              All
            </Link>
            {modules.map((mod) => (
              <Link
                key={mod.id}
                href={`/admin/lessons?moduleId=${mod.id}`}
                className={filterPill(searchParams.moduleId === mod.id)}
              >
                {mod.course.title} → {mod.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {lessons.length > 0 ? (
        <div className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-[#0e0e1a]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Module / Course
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
                {lessons.map((lesson) => (
                  <tr key={lesson.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#eeeaf4]">{lesson.title}</div>
                      {lesson.content && (
                        <div className="mt-1 line-clamp-1 text-sm text-[rgba(238,234,244,0.45)]">
                          {lesson.content.replace(/<[^>]*>/g, '').slice(0, 80)}
                          {lesson.content.length > 80 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lesson.module ? (
                        <>
                          <span className="rounded-full border border-[#b388ff]/30 bg-[#b388ff]/15 px-3 py-1 text-xs font-medium text-[#d4b8ff]">
                            {lesson.module.title}
                          </span>
                          <span className="ml-1 text-sm text-[rgba(238,234,244,0.45)]">
                            ({lesson.module.course.title})
                          </span>
                        </>
                      ) : (
                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[rgba(238,234,244,0.65)]">
                          Independent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[rgba(238,234,244,0.75)]">{lesson.order}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/lessons/${lesson.id}/edit`}
                          className="rounded-lg border border-white/15 px-3 py-1 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                        >
                          Edit
                        </Link>
                        <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-12 text-center shadow-lg">
          <div className="mb-4 text-6xl">📄</div>
          <h3 className="mb-2 text-2xl font-bold text-[#eeeaf4]">No lessons</h3>
          <p className="mb-6 text-[rgba(238,234,244,0.55)]">Create a lesson and attach it to a module</p>
          <Link
            href={searchParams.moduleId ? `/admin/lessons/new?moduleId=${searchParams.moduleId}` : '/admin/lessons/new'}
            className="inline-block rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
          >
            Create Lesson
          </Link>
        </div>
      )}
    </div>
  );
}
