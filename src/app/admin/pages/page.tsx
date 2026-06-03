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
      <div className="space-y-6 text-[#eeeaf4]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
              Pages
            </h1>
            <p className="text-[rgba(238,234,244,0.55)]">
              {pages.length} page{pages.length !== 1 ? 's' : ''} — indexable on
              Google when published
            </p>
          </div>
          <Link
            href="/admin/pages/new"
            className="rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] shadow-[0_4px_20px_rgba(245,193,74,0.2)] transition-colors hover:bg-[#f9d06a]"
          >
            + New Page
          </Link>
        </div>

        {pages.length > 0 ? (
          <div className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-[#0e0e1a]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[rgba(238,234,244,0.55)]">
                    Title
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-[rgba(238,234,244,0.55)]">
                    URL
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-[rgba(238,234,244,0.55)]">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-[rgba(238,234,244,0.55)]">
                    Indexable
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-[rgba(238,234,244,0.55)]">
                    Updated
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-[rgba(238,234,244,0.55)]">
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
                      className="border-b border-white/10 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#eeeaf4]">
                          {page.title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded border border-white/10 bg-[#0e0e1a] px-2 py-0.5 text-xs text-[rgba(238,234,244,0.55)]">
                          /pages/{page.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            page.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/10 text-[rgba(238,234,244,0.65)]'
                          }`}
                        >
                          {page.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            indexable
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {indexable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[rgba(238,234,244,0.55)]">
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
                              className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                            >
                              View
                            </Link>
                          )}
                          <Link
                            href={`/admin/pages/${page.id}/edit`}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
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
          <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-12 text-center shadow-lg">
            <div className="mb-4 text-6xl">📄</div>
            <h3 className="mb-2 text-2xl font-bold text-[#eeeaf4]">
              No custom pages yet
            </h3>
            <p className="mb-6 text-[rgba(238,234,244,0.55)]">
              Create landing pages, SEO pages, or any static content with your
              own HTML + CSS.
            </p>
            <Link
              href="/admin/pages/new"
              className="inline-block rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
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
      <div className="space-y-6 text-[#eeeaf4]">
        <div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
            Pages
          </h1>
        </div>
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-200">
            Connection Error
          </h2>
          <p className="mb-4 text-red-100/90">
            Unable to connect to the database. Run:
            <code className="mt-2 block rounded border border-red-500/30 bg-[#12121f] p-2">
              npx prisma db push
            </code>
            to apply the new CustomPage model.
          </p>
          <details className="text-sm text-red-200/90">
            <summary className="cursor-pointer font-medium">
              Error Details
            </summary>
            <pre className="mt-2 overflow-auto rounded border border-red-500/30 bg-[#12121f] p-2 text-red-100">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
