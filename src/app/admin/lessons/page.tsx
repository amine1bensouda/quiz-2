import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeleteLessonButton from '@/components/Admin/DeleteLessonButton';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Lesson Management
          </h1>
          <p className="text-gray-600">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total
            {searchParams.moduleId && ' in this module'}
          </p>
        </div>
        <Link
          href={searchParams.moduleId ? `/admin/lessons/new?moduleId=${searchParams.moduleId}` : '/admin/lessons/new'}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg"
        >
          ➕ New Lesson
        </Link>
      </div>

      {modules.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Filter by module:</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/lessons"
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                !searchParams.moduleId ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </Link>
            {modules.map((mod) => (
              <Link
                key={mod.id}
                href={`/admin/lessons?moduleId=${mod.id}`}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  searchParams.moduleId === mod.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mod.course.title} → {mod.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {lessons.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Module / Course</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{lesson.title}</div>
                      {lesson.content && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {lesson.content.replace(/<[^>]*>/g, '').slice(0, 80)}
                          {lesson.content.length > 80 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                        {lesson.module.title}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">({lesson.module.course.title})</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{lesson.order}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/lessons/${lesson.id}/edit`}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No lessons</h3>
          <p className="text-gray-600 mb-6">Create a lesson and attach it to a module</p>
          <Link
            href={searchParams.moduleId ? `/admin/lessons/new?moduleId=${searchParams.moduleId}` : '/admin/lessons/new'}
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium"
          >
            Create Lesson
          </Link>
        </div>
      )}
    </div>
  );
}
