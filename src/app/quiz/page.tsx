'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Layout/Navigation';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import CourseCard from '@/components/Quiz/CourseCard';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  moduleCount: number;
  totalQuizzes: number;
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
          
          // Calculer le total de quiz (payload léger)
          const total = coursesData.reduce(
            (sum: number, course: Course) => sum + (course.totalQuizzes || 0),
            0
          );
          setTotalQuizzes(total);
        }
      } catch (error) {
        console.error('Failed to load quiz listing data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="quiz-page relative min-h-screen overflow-hidden bg-[#080810] text-[#eeeaf4]">
      <AnimatedShapes variant="hero" count={6} intensity="medium" />
      <BackgroundPattern variant="luxury" opacity={0.06} />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#f5c14a]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-3rem] top-40 h-80 w-80 rounded-full bg-[#b388ff]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-[#2be4c8]/10 blur-3xl" />
      <Navigation />
      <div className="container relative z-10 mx-auto px-4 py-12 md:py-16">
        {/* Hero Section */}
        <div className="mb-14 animate-fade-in text-center">
          <span className="mb-5 inline-flex rounded-full border border-[#f5c14a]/35 bg-[#f5c14a]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5c14a]">
            Crack The Curve
          </span>
          <h1 className="mb-6 font-['Instrument_Serif',serif] text-5xl leading-tight md:text-6xl lg:text-7xl">
            All Exams
          </h1>
          {!loading && (
            <p className="quiz-hero-note mx-auto inline-block max-w-3xl rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-base text-[#d4d0dc] backdrop-blur-sm md:text-xl">
              {totalQuizzes} exam{totalQuizzes !== 1 ? 's' : ''} available to test your knowledge and improve your mathematics skills
            </p>
          )}
          {!loading && courses.length > 0 && (
            <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 text-left md:grid-cols-4">
              <div className="quiz-stat-card rounded-xl border border-white/10 bg-[#111121]/80 p-4">
                <p className="text-2xl font-bold text-[#f5c14a]">{courses.length}</p>
                <p className="quiz-muted text-xs uppercase tracking-wider text-[#9d98ab]">Exam banks</p>
              </div>
              <div className="quiz-stat-card rounded-xl border border-white/10 bg-[#111121]/80 p-4">
                <p className="text-2xl font-bold text-[#b388ff]">{totalQuizzes}</p>
                <p className="quiz-muted text-xs uppercase tracking-wider text-[#9d98ab]">Total exams</p>
              </div>
              <div className="quiz-stat-card rounded-xl border border-white/10 bg-[#111121]/80 p-4">
                <p className="text-2xl font-bold text-[#2be4c8]">
                  {courses.reduce((sum, course) => sum + (course.moduleCount || 0), 0)}
                </p>
                <p className="quiz-muted text-xs uppercase tracking-wider text-[#9d98ab]">Modules</p>
              </div>
              <div className="quiz-stat-card rounded-xl border border-white/10 bg-[#111121]/80 p-4">
                <p className="text-2xl font-bold text-[#ff5f7e]">48h</p>
                <p className="quiz-muted text-xs uppercase tracking-wider text-[#9d98ab]">Free trial</p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="quiz-loading-card flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#111121]/90 p-10 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-14">
              <LoadingSpinner size="lg" />
              <div className="w-full space-y-3 mt-2">
                <div className="mx-auto h-4 w-48 animate-pulse rounded-full bg-white/15" />
                <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-8">
            {/* Cartes des cours */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                return (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    moduleCount={course.moduleCount}
                    totalQuizzes={course.totalQuizzes}
                    slug={course.slug}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="quiz-empty-card inline-block rounded-3xl border border-white/10 bg-[#111121]/90 p-12 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="text-6xl mb-6">📚</div>
              <h3 className="mb-3 text-2xl font-bold text-[#f5c14a]">
                No Courses Available
              </h3>
              <p className="quiz-muted text-lg text-[#c8c3d2]">Check back soon for new courses!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
