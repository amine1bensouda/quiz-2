'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Layout/Navigation';
import DisplayAd from '@/components/Ads/DisplayAd';
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
    <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <AnimatedShapes variant="hero" count={8} intensity="high" />
      <BackgroundPattern variant="luxury" opacity={0.12} />
      <Navigation />
      <div className="container mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 md:py-12 lg:py-16 relative z-10 max-w-[100vw] overflow-x-hidden">
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm text-gray-600 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-indigo-600">Home</Link>
          <span className="mx-1.5 sm:mx-2">/</span>
          <Link href="/quiz" className="hover:text-indigo-600">Courses</Link>
          <span className="mx-1.5 sm:mx-2">/</span>
          <span className="text-gray-900 font-medium truncate inline-block max-w-[180px] sm:max-w-none">{course.title}</span>
        </nav>

        {/* En-tête du cours */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
          <h1 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight break-words px-1">
            {course.title}
          </h1>
          {course.description && (
            <SafeHtmlRenderer 
              html={course.description}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto backdrop-blur-sm bg-white/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 inline-block prose prose-sm sm:prose-base md:prose-lg max-w-none"
            />
          )}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-gray-600 text-sm sm:text-base">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {totalQuizzes} quiz{totalQuizzes !== 1 ? 'zes' : ''}
            </span>
          </div>
        </div>

        {/* Publicité */}
        <DisplayAd />

        {/* Modules du cours */}
        {course.modules.length > 0 ? (
          <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
            {course.modules.map((module) => {
              if (module._count.quizzes === 0) {
                return null;
              }

              return (
                <Accordion
                  key={module.id}
                  title={module.title}
                  quizCount={module._count.quizzes}
                  defaultOpen={false}
                  icon={
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {module.quizzes.map((quiz, index) => (
                      <QuizCard key={quiz.prismaId ?? quiz.id} quiz={quiz} index={index} />
                    ))}
                  </div>
                </Accordion>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10 md:py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-4">
            <p className="text-gray-600 text-sm sm:text-base">This course has no modules yet.</p>
          </div>
        )}

        {/* Publicité */}
        <DisplayAd />
      </div>
    </div>
  );
}
