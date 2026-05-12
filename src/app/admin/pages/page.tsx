import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeletePageButton from '@/components/Admin/DeletePageButton';

export const dynamic = 'force-dynamic';

export default async function AdminPagesListPage() {
  try {
    const pages = await prisma.customPage.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        noIndex: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Pages
            </h1>
            <p className="text-gray-600">
              {pages.length} page{pages.length !== 1 ? 's' : ''} — indexable on
              Google when published
            </p>
          </div>
          <Link
            href="/admin/pages/new"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
          >
            + New Page
          </Link>
        </div>

        {pages.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Title
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    URL
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Indexable
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                    Updated
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const indexable = page.status === 'published' && !page.noIndex;
                  return (
                    <tr
                      key={page.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {page.title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          /pages/{page.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            page.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {page.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            indexable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {indexable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(page.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {page.status === 'published' && (
                            <Link
                              href={`/pages/${page.slug}`}
                              target="_blank"
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              View
                            </Link>
                          )}
                          <Link
                            href={`/admin/pages/${page.id}/edit`}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <DeletePageButton
                            pageId={page.id}
                            pageTitle={page.title}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No custom pages yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create landing pages, SEO pages, or any static content with your
              own HTML + CSS.
            </p>
            <Link
              href="/admin/pages/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
            >
              Create your first page
            </Link>
          </div>
        )}
      </div>
    );
  } catch (error: any) {
    console.error('AdminPagesListPage:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Pages
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Connection Error
          </h2>
          <p className="text-red-600 mb-4">
            Unable to connect to the database. Run:
            <code className="block mt-2 bg-red-100 p-2 rounded">
              npx prisma db push
            </code>
            to apply the new CustomPage model.
          </p>
          <details className="text-sm text-red-700">
            <summary className="cursor-pointer font-medium">
              Error Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
