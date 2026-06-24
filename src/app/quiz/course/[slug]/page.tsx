import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
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
import { formatPlanPrice, PLANS } from '@/lib/plans';
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
    if (!course && (await isAdminAuthenticated())) {
      course = await getCourseBySlug(slug, { allowUnpublished: true });
    }
  } catch (error) {
    console.error(`Course metadata error (${slug}):`, error);
    return { title: 'Course' };
  }

  if (!course) {
    return { title: 'Course' };
  }

  const isDraft = course.status === 'draft';
  const title = stripHtml(course.title);
  const description =
    excerptFromHtml(course.description || '', 160) ||
    `${title} course on ${SITE_NAME}.`;
  const canonical = `/quiz/course/${encodeURIComponent(course.slug)}`;

  return {
    title: isDraft ? `[Draft] ${title}` : title,
    description,
    ...(isDraft ? { robots: { index: false, follow: false } } : {}),
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
  noStore();
  const { slug } = await Promise.resolve(params);
  let course = null;
  let hasDatabaseError = false;
  const isAdmin = await isAdminAuthenticated();
  try {
    course = await getCourseBySlug(slug);
    if (!course && isAdmin) {
      course = await getCourseBySlug(slug, { allowUnpublished: true });
    }
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
  const hasAccess = await canUserAccessCourse(currentUser?.id ?? null, course.id, isAdmin);
  const isDraftCourse = course.status === 'draft';

  if (currentUser && !hasAccess && !isAdmin) {
    redirect(`/subscribe?courseId=${encodeURIComponent(course.id)}`);
  }

  return (
    <div className="quiz-page relative min-h-screen overflow-hidden bg-[#080810] text-[#eeeaf4]">
      {!isDraftCourse && (
        <CourseSchema
          slug={course.slug}
          title={course.title}
          description={course.description}
          moduleCount={course.modules.length}
          totalQuizzes={totalQuizzes}
        />
      )}
      <AnimatedShapes variant="hero" count={6} intensity="medium" />
      <BackgroundPattern variant="luxury" opacity={0.06} />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#f5c14a]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-3rem] top-40 h-80 w-80 rounded-full bg-[#b388ff]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-[#2be4c8]/10 blur-3xl" />
      <Navigation />
      <div className="relative z-10 mx-auto w-full max-w-4xl overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8 md:px-6 md:py-10 lg:py-12">
        <main className="w-full min-w-0">
          <nav className="scrollbar-hide mb-4 overflow-x-auto whitespace-nowrap pt-0.5 text-xs text-[#9d98ab] sm:mb-6 sm:text-sm">
            <Link href="/" className="transition-colors hover:text-[#f5c14a]">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/quiz" className="transition-colors hover:text-[#f5c14a]">Courses</Link>
            <span className="mx-1.5">/</span>
            <span className="inline-block max-w-[160px] truncate font-medium text-[#eeeaf4] sm:max-w-none">{course.title}</span>
          </nav>

          <header className="animate-fade-in mb-8 sm:mb-10 md:mb-12">
            <div className="course-hero rounded-2xl border border-white/10 bg-[#111121]/85 p-6 shadow-xl shadow-black/30 backdrop-blur-sm sm:rounded-3xl sm:p-8 md:p-10">
              {isDraftCourse && isAdmin && (
                <div
                  className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
                  role="status"
                >
                  <strong className="font-semibold">Preview (draft)</strong>
                  {' — '}
                  This course is not published. Only administrators can view this page.
                </div>
              )}
              <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#b388ff]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#2be4c8]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {totalQuizzes} quiz{totalQuizzes !== 1 ? 'zes' : ''}
                </span>
                {totalLessons > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="mb-3 font-['Instrument_Serif',serif] text-2xl font-bold leading-tight tracking-tight text-[#f5f2ff] min-[400px]:text-3xl sm:mb-4 sm:text-4xl md:text-5xl">
                {course.title}
              </h1>
              {course.description && (
                <div className="prose prose-sm prose-invert sm:prose-base max-w-none">
                  <SafeHtmlRenderer html={course.description} className="leading-relaxed text-[#a29cb0]" />
                </div>
              )}
            </div>
          </header>

          {!hasAccess && (
            <div className="course-unlock-banner animate-fade-in mb-8 rounded-2xl border border-[#f5c14a]/35 bg-[#111121]/90 p-6 shadow-lg shadow-black/30 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#f5c14a]/15 text-[#f5c14a]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="mb-1 text-lg font-bold text-[#eeeaf4] sm:text-xl">
                    Unlock this course
                  </h2>
                  <p className="text-sm text-[#a29cb0] sm:text-base">
                    {formatPlanPrice(PLANS.SINGLE_COURSE)} for this course. 48h free trial — no charge before.
                  </p>
                </div>
                <Link
                  href={`/subscribe?courseId=${course.id}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-[#f5c14a] px-5 py-3 font-semibold text-[#080810] shadow-sm transition hover:bg-[#e5b443]"
                >
                  Start 48h trial
                </Link>
              </div>
            </div>
          )}

          {/* Liste des modules */}
          {course.modules.length > 0 ? (
            <section className="space-y-4 sm:space-y-5 animate-fade-in" aria-label="Course modules">
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
                      <svg className="h-5 w-5 flex-shrink-0 text-[#b388ff] sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    }
                  >
                    <div className="space-y-6">
                      {module.lessons && module.lessons.length > 0 && (
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#d4d0dc]">
                            <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Lessons
                          </h3>
                          <ul className="grid gap-3 grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id}>
                                <Link
                                  href={`/quiz/lesson/${lesson.slug}`}
                                  className="course-lesson-link block rounded-xl border border-white/10 bg-[#141424] p-4 shadow-sm transition-all hover:border-[#f5c14a]/40 hover:shadow-md hover:shadow-black/20"
                                >
                                  <span className="font-medium text-[#f5f2ff]">{lesson.title}</span>
                                  {lesson.videoPlaybackSeconds != null && lesson.videoPlaybackSeconds > 0 && (
                                    <span className="ml-2 text-xs text-[#9d98ab]">
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
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#d4d0dc]">
                              <svg className="h-4 w-4 text-[#b388ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Quizzes
                            </h3>
                          )}
                          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
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
            <div className="course-empty rounded-2xl border border-white/10 bg-[#111121]/80 px-4 py-12 text-center shadow-lg backdrop-blur-sm sm:py-16">
              <p className="text-[#a29cb0]">This course has no modules yet.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
