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
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl p-12 border border-white/40">
              <div className="text-6xl mb-6 animate-spin">⏳</div>
              <p className="text-gray-700 text-lg">Chargement du cours...</p>
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
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl p-12 border border-white/40">
              <div className="text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                Cours introuvable
              </h3>
              <p className="text-gray-700 text-lg mb-6">Le cours demandé n'existe pas.</p>
              <Link
                href="/quiz"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retour aux cours
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
      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-600">
          <Link href="/" className="hover:text-indigo-600">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/quiz" className="hover:text-indigo-600">Cours</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{course.title}</span>
        </nav>

        {/* En-tête du cours */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-6 leading-tight">
            {course.title}
          </h1>
          {course.description && (
            <SafeHtmlRenderer 
              html={course.description}
              className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto backdrop-blur-sm bg-white/40 rounded-2xl p-6 inline-block prose prose-lg max-w-none"
            />
          )}
          <div className="mt-6 flex items-center justify-center gap-6 text-gray-600">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="space-y-6 animate-fade-in">
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
                      className="w-6 h-6 text-indigo-600"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {module.quizzes.map((quiz, index) => (
                      <QuizCard key={quiz.id} quiz={quiz} index={index} />
                    ))}
                  </div>
                </Accordion>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
            <p className="text-gray-600">Ce cours n'a pas encore de modules.</p>
          </div>
        )}

        {/* Publicité */}
        <DisplayAd />
      </div>
    </div>
  );
}
