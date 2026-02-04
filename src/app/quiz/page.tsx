'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Layout/Navigation';
import DisplayAd from '@/components/Ads/DisplayAd';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import CourseCard from '@/components/Quiz/CourseCard';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  modules: {
    id: string;
    title: string;
    slug: string;
    order: number;
    _count: {
      quizzes: number;
    };
  }[];
  _count: {
    modules: number;
  };
}

export default function QuizListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Charger les cours
        const coursesResponse = await fetch('/api/courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData);
          
          // Calculer le total de quiz
          const total = coursesData.reduce((sum: number, course: Course) => {
            return sum + course.modules.reduce((moduleSum, module) => moduleSum + module._count.quizzes, 0);
          }, 0);
          setTotalQuizzes(total);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculer le total de quiz par cours
  const getTotalQuizzesForCourse = (course: Course): number => {
    return course.modules.reduce((total, module) => total + module._count.quizzes, 0);
  };

  return (
    <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <AnimatedShapes variant="hero" count={8} intensity="high" />
      <BackgroundPattern variant="luxury" opacity={0.12} />
      <Navigation />
      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-6 leading-tight">
            All Quizzes
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto backdrop-blur-sm bg-white/40 rounded-2xl p-6 inline-block">
            {totalQuizzes} quiz{totalQuizzes !== 1 ? 'zes' : ''} available to test your knowledge and improve your mathematics skills
          </p>
        </div>

        {/* Publicité */}
        <DisplayAd />

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl p-12 border border-white/40">
              <div className="text-6xl mb-6 animate-spin">⏳</div>
              <p className="text-gray-700 text-lg">Chargement...</p>
            </div>
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-8">
            {/* Cartes des cours */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const courseTotalQuizzes = getTotalQuizzesForCourse(course);
                return (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    moduleCount={course._count.modules}
                    totalQuizzes={courseTotalQuizzes}
                    slug={course.slug}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl p-12 border border-white/40">
              <div className="text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                No Courses Available
              </h3>
              <p className="text-gray-700 text-lg">Check back soon for new courses!</p>
            </div>
          </div>
        )}

        {/* Publicité */}
        <DisplayAd />
      </div>
    </div>
  );
}
