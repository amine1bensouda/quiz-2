import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeleteModuleButton from '@/components/Admin/DeleteModuleButton';

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: { courseId?: string };
}) {
  const where = searchParams.courseId ? { courseId: searchParams.courseId } : {};

  const modules = await prisma.module.findMany({
    where,
    include: {
      course: true,
      _count: {
        select: {
          quizzes: true,
        },
      },
    },
    orderBy: [
      { course: { title: 'asc' } },
      { order: 'asc' },
    ],
  });

  const courses = searchParams.courseId
    ? []
    : await prisma.course.findMany({
        orderBy: { title: 'asc' },
      });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Module Management
          </h1>
          <p className="text-gray-600">
            {modules.length} module{modules.length !== 1 ? 's' : ''} total
            {searchParams.courseId && ' for this course'}
          </p>
        </div>
        <Link
          href={searchParams.courseId ? `/admin/modules/new?courseId=${searchParams.courseId}` : '/admin/modules/new'}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
        >
          ➕ New Module
        </Link>
      </div>

      {courses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Filter by course:</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/modules"
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                !searchParams.courseId
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </Link>
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/modules?courseId=${course.id}`}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  searchParams.courseId === course.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {course.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {modules.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {modules.map((module) => (
                  <tr key={module.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{module.title}</div>
                      {module.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {module.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {module.course.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {module.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {module._count.quizzes}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {module.order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/modules/${module.id}/edit`}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
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
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No modules</h3>
          <p className="text-gray-600 mb-6">Start by creating your first module</p>
          <Link
            href={searchParams.courseId ? `/admin/modules/new?courseId=${searchParams.courseId}` : '/admin/modules/new'}
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
          >
            Create a module
          </Link>
        </div>
      )}
    </div>
  );
}
