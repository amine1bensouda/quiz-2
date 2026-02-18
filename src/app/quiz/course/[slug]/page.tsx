'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Layout/Navigation';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import Accordion from '@/components/Layout/Accordion';
import QuizCard from '@/components/Quiz/QuizCard';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';
import type { Quiz } from '@/lib/types';

interface Module {
  id: string;
  title: string;
  slug: string;
  order: number;
  quizzes: Quiz[];
  _count: {
    quizzes: number;
  };
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  modules: Module[];
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      try {
        const response = await fetch(`/api/courses/${slug}`);
        if (response.ok) {
          const courseData = await response.json();
          setCourse(courseData);
        } else if (response.status === 404) {
          // Rediriger vers la page 404 ou la liste des cours
          router.push('/quiz');
        }
      } catch (error) {
        console.error('Erreur chargement cours:', error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCourse();
    }
  }, [slug, router]);

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 py-12 sm:py-16 md:py-20 max-w-[100vw]">
          <div className="text-center">
            <div className="inline-block backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12 border border-white/40">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 animate-spin">⏳</div>
              <p className="text-gray-700 text-base sm:text-lg">Loading the course...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-5 md:px-6 py-12 sm:py-16 md:py-20 max-w-[100vw]">
          <div className="text-center">
            <div className="inline-block backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 border border-white/40 max-w-full">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">📚</div>
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2 sm:mb-3">
                Course not found
              </h3>
              <p className="text-gray-700 text-sm sm:text-lg mb-4 sm:mb-6">The requested course does not exist.</p>
              <Link
                href="/quiz"
                className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
              >
                Back to courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalQuizzes = course.modules.reduce((sum, module) => sum + module._count.quizzes, 0);

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
                if (module._count.quizzes === 0) return null;
                return (
                  <Accordion
                    key={module.id}
                    title={module.title}
                    quizCount={module._count.quizzes}
                    defaultOpen={false}
                    icon={
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {module.quizzes.map((quiz, index) => (
                        <QuizCard key={quiz.prismaId ?? quiz.id} quiz={quiz} index={index} />
                      ))}
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
