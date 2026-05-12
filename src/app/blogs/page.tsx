import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import Link from 'next/link';
import { getAllBlogPostsFromDB } from '@/lib/blog-data';
import AnimatedShapes from '@/components/Layout/AnimatedShapesClient';
import BackgroundPattern from '@/components/Layout/BackgroundPatternClient';

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const blogPosts = await getAllBlogPostsFromDB();
  const hasPosts = blogPosts.length > 0;

  return {
    title: 'Blog | Math Tips, Exam Prep & Free Practice',
    description: `Read our latest articles, exam tips, and free practice guides from ${SITE_NAME}. ACT, SAT, algebra, and more.`,
    alternates: { canonical: '/blogs' },
    openGraph: {
      title: 'Blog | Crack The Curve',
      description: `Articles and tips to help you score higher. Free math practice for ACT, SAT, and more.`,
    },
    robots: hasPosts
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function BlogsPage() {
  const blogPosts = await getAllBlogPostsFromDB();

  return (
    <div className="blog-page relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/40 overflow-hidden">
      <AnimatedShapes variant="hero" count={6} intensity="medium" />
      <BackgroundPattern variant="grid" opacity={0.05} />

      <div className="container mx-auto px-4 sm:px-5 md:px-6 py-10 sm:py-12 md:py-16 relative z-10 max-w-[100vw]">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <header className="text-center mb-10 sm:mb-14 md:mb-16">
            <div className="relative mx-auto max-w-4xl px-6 py-8 sm:px-10 sm:py-10">
              <span className="relative mb-4 inline-flex items-center rounded-full border border-amber-300/80 bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                Crack The Curve Journal
              </span>
              <h1 className="blog-title relative text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-amber-600 via-amber-500 to-slate-900 bg-clip-text text-transparent mb-3 sm:mb-4">
                Blog
              </h1>
              <p className="blog-subtitle relative text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Tips, exam prep, and free practice guides to help you master math for ACT, SAT, and more.
              </p>
            </div>
          </header>

          {blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blogs/${post.slug}`}
                  className="blog-card group flex flex-col backdrop-blur-xl bg-white/90 rounded-2xl sm:rounded-3xl shadow-lg border border-white/60 overflow-hidden hover:shadow-xl hover:border-amber-200/80 transition-all duration-300"
                >
                  <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1">
                    <span className="blog-category inline-block w-fit px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">
                      {post.category}
                    </span>
                    <h2 className="blog-card-title text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-amber-700 transition-colors">
                      {post.title}
                    </h2>
                    <p className="blog-muted text-sm sm:text-base text-gray-600 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="blog-card-footer mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="blog-muted text-xs sm:text-sm text-gray-500">
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="blog-link text-sm font-semibold text-amber-700 group-hover:underline">
                        Read more →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="blog-empty text-center py-16 sm:py-20 backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-xl border border-white/40">
              <div className="text-5xl sm:text-6xl mb-4">📝</div>
              <p className="blog-muted text-base sm:text-lg">No blog posts available at the moment.</p>
            </div>
          )}

          {/* CTA band */}
          <div className="mt-12 sm:mt-16 text-center">
            <div className="blog-cta inline-flex flex-col sm:flex-row items-center gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-50 to-slate-50 border border-amber-200/80">
              <p className="blog-cta-text text-gray-700 font-medium text-sm sm:text-base">
                Ready to practice? Try our free math quizzes.
              </p>
              <Link
                href="/quiz"
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#f5c14a] text-[#0c0a00] font-semibold rounded-xl hover:bg-[#f9d06a] transition-colors text-sm sm:text-base"
              >
                View quizzes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
