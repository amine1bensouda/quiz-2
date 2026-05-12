import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostFromDB } from '@/lib/blog-data';

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
    title: `${post.title} | Crack The Curve`,
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

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="blog-post-page min-h-screen bg-white">
      <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-8 sm:py-12">
        <Link
          href="/blogs"
          className="blog-post-back inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All articles
        </Link>

        <div className="mb-3">
          <span className="blog-post-category inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            {post.category}
          </span>
        </div>

        <h1 className="blog-post-title text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-slate-900">
          {post.title}
        </h1>

        <div className="blog-post-meta mt-4 flex items-center gap-2 text-sm text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <time dateTime={post.date}>{formattedDate}</time>
        </div>

        <article
          className="blog-post-content blog-article-content prose prose-slate prose-lg max-w-none mt-8
            prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight
            prose-p:text-slate-700 prose-p:leading-[1.8]
            prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
}
