import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Layout/Navigation';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import Accordion from '@/components/Layout/Accordion';
import QuizCard from '@/components/Quiz/QuizCard';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';
import { getCourseBySlug } from '@/lib/course-service';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function CoursePage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);
  const course = await getCourseBySlug(slug);

  if (!course) {
    redirect('/quiz');
  }

  const totalQuizzes = course.modules.reduce((sum, module) => sum + module._count.quizzes, 0);
  const totalLessons = course.modules.reduce((sum, module) => sum + (module._count.lessons ?? 0), 0);

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50 min-h-screen">
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
