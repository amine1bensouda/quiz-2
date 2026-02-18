import { Metadata } from 'next';
import Link from 'next/link';
import { getAllQuiz } from '@/lib/quiz-service';
import { getStats } from '@/lib/wordpress';
import { getAllPublishedCourses } from '@/lib/course-service';
import QuizCard from '@/components/Quiz/QuizCard';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';

export const metadata: Metadata = {
  title: 'Home',
  description: SITE_DESCRIPTION,
};

export const revalidate = 3600; // Revalider toutes les heures

const CARD_COLORS = [
  { gradient: 'from-purple-600 to-purple-800', bg: 'from-purple-500 to-purple-600', btn: 'from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' },
  { gradient: 'from-blue-600 to-blue-800', bg: 'from-blue-500 to-blue-600', btn: 'from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700' },
  { gradient: 'from-pink-600 to-pink-800', bg: 'from-pink-500 to-pink-600', btn: 'from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700' },
];

export default async function HomePage() {
  const [quizs, stats, publishedCourses] = await Promise.all([
    getAllQuiz(),
    getStats(),
    getAllPublishedCourses(),
  ]);

  // Afficher les 6 premiers quiz en vedette
  const featuredQuizs = quizs.slice(0, 6);

  // Grille des cartes de cours (tous les cours publiés)
  const courseCardsCount = publishedCourses.length;
  const gridColsClass = courseCardsCount >= 3 ? 'md:grid-cols-3' : 
                        courseCardsCount === 2 ? 'md:grid-cols-2' : 
                        'md:grid-cols-1';

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 sm:py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="wave-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0,50 Q25,30 50,50 T100,50" stroke="#9ca3af" strokeWidth="1" fill="none" opacity="0.3"/>
                <circle cx="25" cy="30" r="2" fill="#9ca3af" opacity="0.3"/>
                <circle cx="50" cy="50" r="2" fill="#9ca3af" opacity="0.3"/>
                <circle cx="75" cy="30" r="2" fill="#9ca3af" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave-pattern)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-[100vw] overflow-x-hidden">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl min-[480px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-6 md:mb-8 leading-tight break-words">
              <span className="bg-gradient-to-r from-purple-800 to-purple-900 bg-clip-text text-transparent">
                Free Math Practice
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                Problems
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                for All Standardized
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Exams
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-800 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-0 sm:px-2">
              Practice math for the{' '}
              <span className="text-blue-600 font-bold">ACT</span>,{' '}
              <span className="text-pink-600 font-bold">SAT</span>,{' '}
              <span className="text-red-500 font-bold">AP</span>,{' '}
              <span className="text-blue-500 font-bold">GRE</span>,{' '}
              <span className="text-blue-700 font-bold">GMAT</span>, and more —{' '}
              <span className="text-emerald-600 font-bold">completely free!</span>
            </p>
            <div className="max-w-4xl mx-auto mb-8 sm:mb-10">
              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 shadow-lg">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">The School of Mathematics</span> is a free online platform offering high-quality math practice problems for standardized exams in the United States. Improve your skills and prepare for any major math test with{' '}
                  <span className="font-bold text-blue-600">thousands of exam-style questions</span>.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 sm:px-8 sm:py-4 md:px-10 md:py-5 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span>Start Practicing</span>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/about-us"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 sm:px-8 sm:py-4 md:px-10 md:py-5 text-base sm:text-lg font-semibold bg-white text-gray-900 rounded-xl hover:bg-gray-50 border-2 border-gray-300 transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Standardized Tests Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white via-gray-50 to-white overflow-hidden">
        <AnimatedShapes variant="section" count={6} intensity="medium" />
        <BackgroundPattern variant="grid" opacity={0.08} />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-[100vw]">
          <div className="max-w-6xl mx-auto">
            {courseCardsCount > 0 && (
              <div className={`grid grid-cols-1 ${gridColsClass} gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12`}>
              {publishedCourses.map((course, index) => {
                const colors = CARD_COLORS[index % CARD_COLORS.length];
                const totalQuizzes = course.modules?.reduce((sum, m) => sum + (m._count?.quizzes ?? 0), 0) ?? 0;
                const moduleCount = course._count?.modules ?? course.modules?.length ?? 0;
                return (
                  <div key={course.id} className="backdrop-blur-xl bg-white/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border border-white/40 hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group active:scale-[0.99]">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className={`text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent break-words pr-2`}>
                        {course.title}
                      </h3>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent mb-1 sm:mb-2`}>
                      {formatNumber(moduleCount)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 font-semibold mb-4 sm:mb-6">
                      {moduleCount === 1 ? 'Module' : 'Modules'} · {formatNumber(totalQuizzes)} {totalQuizzes === 1 ? 'quiz' : 'quizzes'}
                    </div>
                    <Link
                      href={course.slug ? `/quiz/course/${course.slug}` : '/quiz'}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r ${colors.btn} text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base`}
                    >
                      Practicing
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                );
              })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="backdrop-blur-xl bg-white/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border border-white/40 md:hover:scale-105 transition-all duration-300">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {formatNumber(stats.total_quiz)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-semibold">Available Quizzes</div>
              </div>
              <div className="backdrop-blur-xl bg-white/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border border-white/40 md:hover:scale-105 transition-all duration-300">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {formatNumber(stats.total_questions)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-semibold">Practice Questions</div>
              </div>
              <div className="backdrop-blur-xl bg-white/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border border-white/40 md:hover:scale-105 transition-all duration-300">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {formatNumber(stats.total_categories)}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-semibold">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How The School of Mathematics Helps You Score Higher Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 overflow-hidden">
        <AnimatedShapes variant="section" count={6} intensity="medium" />
        <BackgroundPattern variant="grid" opacity={0.1} />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-[100vw]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 sm:mb-6 px-1">
                How The School of Mathematics Helps You Score Higher
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="text-center p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/70 hover:bg-white/90 shadow-2xl border border-white/30 md:hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3 sm:mb-4">Practice Real Exam Questions</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Solve ACT, SAT, AP, and GCSE-style math problems written to match real test difficulty and format.
                </p>
              </div>
              <div className="text-center p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/70 hover:bg-white/90 shadow-2xl border border-white/30 md:hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3 sm:mb-4">Understand What Matters</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Each problem focuses on high-frequency exam concepts, not random math theory.
                </p>
              </div>
              <div className="text-center p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/70 hover:bg-white/90 shadow-2xl border border-white/30 md:hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3 sm:mb-4">Train Like Test Day</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Timed practice helps you build speed, accuracy, and confidence under real exam conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Students Use The School of Mathematics Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-violet-50 to-rose-50 overflow-hidden">
        <AnimatedShapes variant="floating" count={7} intensity="medium" />
        <BackgroundPattern variant="circular" opacity={0.12} />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-[100vw]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-violet-900 to-rose-900 bg-clip-text text-transparent mb-4 sm:mb-6 px-1">
                Why Students Use The School of Mathematics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div className="backdrop-blur-xl bg-white/80 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 md:hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 sm:mb-3">Exam-Accurate Math Practice</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Solve ACT, SAT, AP, and GCSE-style math problems written to match real test difficulty and format.
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/80 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 md:hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 sm:mb-3">Difficulty That Matches the Test</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Each problem focuses on high-frequency exam concepts, not random math theory.
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/80 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 md:hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 sm:mb-3">Concept-Focused Learning</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Each problem targets one core concept. Prepared eases. No gimmicks.
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/80 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 md:hover:shadow-3xl md:hover:scale-105 transition-all duration-300 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 sm:mb-3">Unlimited Free Practice</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  All Major Math Exams in One Place. No paying or waiting. Practice under real exam conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose If You Are Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
        <AnimatedShapes variant="section" count={6} intensity="medium" />
        <BackgroundPattern variant="dots" opacity={0.12} />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-[100vw]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 bg-clip-text text-transparent mb-4 sm:mb-6 px-1">
                Choose {SITE_NAME} If You Are:
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {[
                { title: 'Just Getting Started', desc: 'Follow a clear path to better scores with our science-backed tools that help you learn faster.' },
                { title: 'At a Plateau', desc: 'Find areas where you need improvement with our analytics so you can focus on what matters most.' },
                { title: 'Busy', desc: 'Stay on track — even when life gets hectic — with our study tools that adapt to your schedule.' },
                { title: '"Not A Good Test Taker"', desc: 'Learn to outsmart tricky questions with targeted practice and proven strategies.' },
                { title: 'Retaking the Exam', desc: 'Pinpoint and correct past problem areas with focused practice and personalized feedback.' },
                { title: 'Stressed By the Clock', desc: 'Practice with our timer feature to stay calm and focused, giving you the best shot at a high score.' },
              ].map((item, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/80 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-xl md:hover:shadow-2xl transition-all duration-300 border border-white/40 md:hover:scale-105 md:hover:bg-white/90">
                  <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Quizzes Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-white via-indigo-50 to-purple-50 overflow-hidden">
        <AnimatedShapes variant="floating" count={7} intensity="medium" />
        <BackgroundPattern variant="grid" opacity={0.1} />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-[100vw]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                Featured Quizzes
              </h2>
              <Link
                href="/quiz"
                className="backdrop-blur-xl bg-white/80 hover:bg-white/90 text-gray-900 hover:text-gray-700 font-semibold text-base sm:text-lg flex items-center justify-center sm:justify-start gap-2 group px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl border border-white/40 hover:border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 w-fit"
              >
                View All
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {featuredQuizs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {featuredQuizs.map((quiz, index) => (
                  <QuizCard key={quiz.prismaId ?? quiz.id} quiz={quiz} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 sm:py-14 md:py-16 backdrop-blur-xl bg-white/60 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 px-4">
                <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📚</div>
                <p className="text-gray-700 text-base sm:text-lg font-semibold">No quizzes available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
        <AnimatedShapes variant="luxury" count={8} intensity="high" />
        <BackgroundPattern variant="luxury" opacity={0.15} color="white" />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-[100vw]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent px-1">
              Ready to Excel in Mathematics?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto backdrop-blur-sm bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
              Join thousands of students who are improving their math skills and building confidence with our comprehensive practice platform.
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 py-4 sm:px-8 sm:py-4 md:px-10 md:py-5 text-base sm:text-lg font-semibold bg-gradient-to-r from-white to-gray-100 text-gray-900 rounded-xl sm:rounded-2xl hover:from-gray-100 hover:to-white transition-all duration-300 shadow-2xl md:hover:shadow-3xl md:hover:scale-105 active:scale-[0.98]"
            >
              <span>Get Started Now</span>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

