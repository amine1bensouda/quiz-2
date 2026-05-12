import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Layout/Navigation';
import AnimatedShapes from '@/components/Layout/AnimatedShapesClient';
import BackgroundPattern from '@/components/Layout/BackgroundPatternClient';
import Accordion from '@/components/Layout/Accordion';
import QuizCard from '@/components/Quiz/QuizCard';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';
import CourseSchema from '@/components/SEO/CourseSchema';
import { getCourseBySlug } from '@/lib/course-service';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { excerptFromHtml, stripHtml } from '@/lib/utils';
import { getCurrentUserFromSession } from '@/lib/auth-server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { canUserAccessCourse } from '@/lib/subscription-access';

// L'affichage dépend de l'état d'abonnement de l'utilisateur (lock banner).
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  let course = null;
  try {
    course = await getCourseBySlug(slug);
  } catch (error) {
    console.error(`Course metadata error (${slug}):`, error);
    return { title: 'Course' };
  }

  if (!course) {
    return { title: 'Course' };
  }

  const title = stripHtml(course.title);
  const description =
    excerptFromHtml(course.description || '', 160) ||
    `${title} course on ${SITE_NAME}.`;
  const canonical = `/quiz/course/${encodeURIComponent(course.slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${SITE_URL}${canonical}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CoursePage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);
  let course = null;
  let hasDatabaseError = false;
  try {
    course = await getCourseBySlug(slug);
  } catch (error) {
    console.error(`Failed to load course (${slug}):`, error);
    hasDatabaseError = true;
  }

  if (hasDatabaseError) {
    return (
      <div className="relative min-h-screen bg-[#080810] text-[#eeeaf4]">
        <AnimatedShapes variant="hero" count={4} intensity="low" />
        <BackgroundPattern variant="luxury" opacity={0.05} />
        <Navigation />
        <div className="container relative z-10 mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#f5c14a]/35 bg-[#111121]/90 p-8 shadow-2xl shadow-black/40">
            <h1 className="mb-3 text-2xl font-bold text-[#f5c14a]">Course temporarily unavailable</h1>
            <p className="mb-6 text-[#d4d0dc]">
              We cannot load this course right now because the database connection is unavailable.
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
            >
              Back to all courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    redirect('/quiz');
  }

  const totalQuizzes = course.modules.reduce((sum, module) => sum + module._count.quizzes, 0);
  const totalLessons = course.modules.reduce((sum, module) => sum + (module._count.lessons ?? 0), 0);

  const currentUser = await getCurrentUserFromSession();
  const isAdmin = await isAdminAuthenticated();
  const hasAccess = await canUserAccessCourse(currentUser?.id ?? null, course.id, isAdmin);

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50 min-h-screen">
      <CourseSchema
        slug={course.slug}
        title={course.title}
        description={course.description}
        moduleCount={course.modules.length}
        totalQuizzes={totalQuizzes}
      />
      <AnimatedShapes variant="hero" count={6} intensity="medium" />
      <BackgroundPattern variant="luxury" opacity={0.08} />
      <Navigation />
      <div className="flex gap-4 lg:gap-6 xl:gap-8 container mx-auto px-4 sm:px-5 md:px-6 py-6 sm:py-8 md:py-10 lg:py-12 relative z-10 max-w-[100vw] overflow-x-hidden">
        <main className="flex-1 min-w-0 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/quiz" className="hover:text-indigo-600 transition-colors">Courses</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-900 font-medium truncate max-w-[160px] sm:max-w-none inline-block">{course.title}</span>
          </nav>

          {/* Hero cours — design éditorial */}
          <header className="mb-8 sm:mb-10 md:mb-12 animate-fade-in">
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xl shadow-indigo-900/5 p-6 sm:p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {totalQuizzes} quiz{totalQuizzes !== 1 ? 'zes' : ''}
                </span>
                {totalLessons > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight tracking-tight">
                {course.title}
              </h1>
              {course.description && (
                <div className="prose prose-sm sm:prose-base prose-gray max-w-none">
                  <SafeHtmlRenderer html={course.description} className="text-gray-600 leading-relaxed" />
                </div>
              )}
            </div>
          </header>

          {!hasAccess && (
            <div className="mb-8 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 sm:p-8 shadow-lg animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    Unlock this course
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700">
                    $7/month for this course alone, or $25/month for all
                    courses. 48h free trial — no charge before.
                  </p>
                </div>
                <Link
                  href={`/subscribe?courseId=${course.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-sm hover:bg-indigo-700 whitespace-nowrap"
                >
                  Start 48h trial
                </Link>
              </div>
            </div>
          )}

          {/* Liste des modules */}
          {course.modules.length > 0 ? (
            <section className="space-y-4 sm:space-y-5 animate-fade-in" aria-label="Modules du cours">
              {course.modules.map((module) => {
                const hasQuizzes = (module._count.quizzes ?? 0) > 0;
                const hasLessons = (module._count.lessons ?? 0) > 0;
                if (!hasQuizzes && !hasLessons) return null;
                return (
                  <Accordion
                    key={module.id}
                    title={module.title}
                    quizCount={module._count.quizzes ?? 0}
                    lessonCount={module._count.lessons ?? 0}
                    defaultOpen={false}
                    icon={
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    }
                  >
                    <div className="space-y-6">
                      {module.lessons && module.lessons.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Lessons
                          </h3>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id}>
                                <Link
                                  href={`/quiz/lesson/${lesson.slug}`}
                                  className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                                >
                                  <span className="font-medium text-gray-900">{lesson.title}</span>
                                  {lesson.videoPlaybackSeconds != null && lesson.videoPlaybackSeconds > 0 && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      {Math.floor(lesson.videoPlaybackSeconds / 60)} min
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hasQuizzes && (
                        <div>
                          {module.lessons && module.lessons.length > 0 && (
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Quizzes
                            </h3>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {module.quizzes.map((quiz, index) => (
                              <QuizCard key={quiz.prismaId ?? quiz.id} quiz={quiz} index={index} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Accordion>
                );
              })}
            </section>
          ) : (
            <div className="text-center py-12 sm:py-16 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/80 shadow-lg px-4">
              <p className="text-gray-600">This course has no modules yet.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
