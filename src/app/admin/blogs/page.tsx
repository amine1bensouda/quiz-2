import { prisma } from '@/lib/db';
import Link from 'next/link';
import DeleteBlogButton from '@/components/Admin/DeleteBlogButton';

export default async function AdminBlogsPage() {
  try {
    const blogs = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return (
      <div className="space-y-6 text-[#eeeaf4]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
            Blog Management
          </h1>
          <p className="text-[rgba(238,234,244,0.55)]">{blogs.length} post{blogs.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link
            href="/admin/blogs/new"
            className="rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] shadow-[0_4px_20px_rgba(245,193,74,0.2)] transition-colors hover:bg-[#f9d06a]"
          >
            + New Blog Post
          </Link>
        </div>

        {blogs.length > 0 ? (
          <div className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-[#0e0e1a]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[rgba(238,234,244,0.55)]">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[rgba(238,234,244,0.55)]">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[rgba(238,234,244,0.55)]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[rgba(238,234,244,0.55)]">Date</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[rgba(238,234,244,0.55)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {blogs.map((blog) => (
                  <tr
                    key={blog.id}
                    className="transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-[#eeeaf4]">{blog.title}</p>
                        <code className="rounded border border-white/10 bg-[#0e0e1a] px-2 py-0.5 text-xs text-[rgba(238,234,244,0.55)]">
                          {blog.slug}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {blog.category ? (
                        <span className="rounded-full border border-[#b388ff]/30 bg-[#b388ff]/15 px-3 py-1 text-xs font-medium text-[#d4b8ff]">
                          {blog.category}
                        </span>
                      ) : (
                        <span className="text-sm text-[rgba(238,234,244,0.35)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          blog.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 text-[rgba(238,234,244,0.65)]'
                        }`}
                      >
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[rgba(238,234,244,0.55)]">
                      {new Date(blog.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blogs/${blog.id}/edit`}
                          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                        >
                          Edit
                        </Link>
                        <DeleteBlogButton blogId={blog.id} blogTitle={blog.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-surface rounded-2xl border border-white/10 bg-[#12121f] p-12 text-center shadow-lg">
            <div className="mb-4 text-6xl">📰</div>
            <h3 className="mb-2 text-2xl font-bold text-[#eeeaf4]">No blog posts</h3>
            <p className="mb-6 text-[rgba(238,234,244,0.55)]">Start by creating your first blog post</p>
            <Link
              href="/admin/blogs/new"
              className="inline-block rounded-full bg-[#f5c14a] px-6 py-3 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
            >
              Create a post
            </Link>
          </div>
        )}
      </div>
    );
  } catch (error: any) {
    console.error('AdminBlogsPage:', error);
    return (
      <div className="space-y-6 text-[#eeeaf4]">
        <div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
            Blog Management
          </h1>
        </div>
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-200">Connection Error</h2>
          <p className="mb-4 text-red-100/90">
            Unable to connect to the database. Please check your configuration.
          </p>
          <details className="text-sm text-red-200/90">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 overflow-auto rounded border border-red-500/30 bg-[#12121f] p-2 text-red-100">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
