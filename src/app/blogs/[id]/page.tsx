import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getBlogPostById,
  getBlogPostBySlug,
  getRelatedBlogPosts,
  getAllBlogPosts,
} from '@/lib/blog-data';

interface PageProps {
  params: { id: string };
}

function getPost(id: string) {
  const byId = getBlogPostById(id);
  if (byId) return byId;
  return getBlogPostBySlug(id);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getPost(params.id);
  if (!post) return { title: 'Blog' };
  return {
    title: `${post.title} | The School of Mathematics`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  };
}

export function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.flatMap((p) => [
    { id: String(p.id) },
    ...(p.slug ? [{ id: p.slug }] : []),
  ]);
}

export default function BlogPostPage({ params }: PageProps) {
  const post = getPost(params.id);

  if (!post) {
    notFound();
  }

  const related = getRelatedBlogPosts(post.id, 3);
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Editorial header: full-width dark band */}
      <header className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-5 md:px-6 py-6 sm:py-8 md:py-10 max-w-[100vw]">
          <div className="max-w-3xl">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All articles
            </Link>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-3">
              {post.category}
            </p>
            <h1 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-white">
              {post.title}
            </h1>
            <time
              dateTime={post.date}
              className="mt-4 block text-sm text-slate-400"
            >
              {formattedDate}
            </time>
          </div>
        </div>
      </header>

      {/* Main: content + sidebar */}
      <div className="container mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 md:py-12 max-w-[100vw]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:gap-12">
          {/* Article body - reading column */}
          <article className="flex-1 min-w-0 lg:max-w-[65%]">
            <div
              className="prose prose-slate prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight
                prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2
                prose-p:text-slate-700 prose-p:leading-[1.75]
                prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags - below content on mobile, can stay in flow */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar - sticky on desktop */}
          <aside className="mt-10 lg:mt-0 lg:w-[35%] lg:max-w-sm lg:flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-8">
              {/* CTA */}
              {(post.ctaLink && post.ctaText) && (
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white">
                  <p className="text-sm font-semibold text-amber-400/90 mb-2">Next step</p>
                  <Link
                    href={post.ctaLink}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm"
                  >
                    {post.ctaText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* Related */}
              {related.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Related articles
                  </h3>
                  <ul className="space-y-3">
                    {related.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/blogs/${p.id}`}
                          className="group block p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                        >
                          <span className="text-xs font-medium text-slate-400">{p.category}</span>
                          <p className="mt-0.5 font-semibold text-slate-900 group-hover:text-indigo-600 text-sm leading-snug line-clamp-2">
                            {p.title}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Back to list */}
              <Link
                href="/blogs"
                className="block text-center py-3 text-sm font-medium text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
              >
                ← Back to all articles
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
