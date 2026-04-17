import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import {
  getBlogPostFromDB,
  getAllBlogPostsFromDB,
} from '@/lib/blog-data';

export const revalidate = 900;

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idOrSlug } = await Promise.resolve(params);
  const post = await getBlogPostFromDB(idOrSlug);
  if (!post) return { title: 'Blog' };

  const canonical = `/blogs/${encodeURIComponent(post.slug)}`;

  return {
    title: `${post.title} | The School of Mathematics`,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id: idOrSlug } = await Promise.resolve(params);
  const post = await getBlogPostFromDB(idOrSlug);

  if (!post) {
    notFound();
  }
  if (idOrSlug !== post.slug) {
    permanentRedirect(`/blogs/${post.slug}`);
  }

  const allPosts = await getAllBlogPostsFromDB();
  const sameCategory = allPosts.filter((p) => String(p.id) !== String(post.id) && p.category === post.category);
  const rest = allPosts.filter((p) => String(p.id) !== String(post.id) && p.category !== post.category);
  const related = [...sameCategory, ...rest].slice(0, 3);
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-5 md:px-6 py-7 sm:py-9 md:py-12 max-w-[100vw]">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All articles
            </Link>
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {post.category}
              </span>
            </div>
            <h1 className="text-3xl min-[400px]:text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-slate-900">
              {post.title}
            </h1>
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <time dateTime={post.date}>{formattedDate}</time>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 md:py-14 max-w-[100vw]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          <article className="lg:col-span-8 min-w-0">
            <div
              className="blog-article-content prose prose-slate prose-lg max-w-none rounded-3xl border border-slate-200 bg-white px-6 py-7 sm:px-9 sm:py-10 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.45)]
                prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight
                prose-h1:mt-2 prose-h1:mb-5 prose-h1:text-3xl
                prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:relative
                prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg sm:prose-h3:text-xl
                prose-p:text-slate-700 prose-p:leading-[1.8]
                prose-ul:my-4 prose-ol:my-4 prose-li:my-1
                prose-blockquote:border-indigo-300 prose-blockquote:text-slate-700 prose-blockquote:bg-indigo-50/40 prose-blockquote:rounded-r-lg prose-blockquote:py-1
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

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-8">
              {(post.ctaLink && post.ctaText) && (
                <div className="p-5 sm:p-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 text-slate-900">
                  <p className="text-sm font-semibold text-indigo-700 mb-2">Next step</p>
                  <Link
                    href={post.ctaLink}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                  >
                    {post.ctaText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              )}

              {related.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Related articles
                  </h3>
                  <ul className="space-y-3">
                    {related.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/blogs/${p.slug}`}
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

              <Link
                href="/blogs"
                className="block text-center py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:border-slate-300 bg-white transition-colors"
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
