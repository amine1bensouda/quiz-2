'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Layout/Navigation';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import CourseCard from '@/components/Quiz/CourseCard';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';
import { getCurrentUser } from '@/lib/auth-client';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  moduleCount: number;
  totalQuizzes: number;
}

export default function QuizListPage() {
  const [accessibleCourses, setAccessibleCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const accessibleIds = useMemo(
    () => new Set(accessibleCourses.map((course) => course.id)),
    [accessibleCourses]
  );

  const displayedCourses = useMemo(() => {
    if (!isAuthenticated || !showAllCourses) {
      return isAuthenticated ? accessibleCourses : allCourses;
    }
    return allCourses;
  }, [isAuthenticated, showAllCourses, accessibleCourses, allCourses]);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);

        if (user) {
          const [accessibleRes, allRes] = await Promise.all([
            fetch('/api/courses/accessible', { credentials: 'include' }),
            fetch('/api/courses'),
          ]);

          if (accessibleRes.ok) {
            const accessibleData = await accessibleRes.json();
            setAccessibleCourses(accessibleData);
          }

          if (allRes.ok) {
            const allData = await allRes.json();
            setAllCourses(allData);
            const total = allData.reduce(
              (sum: number, course: Course) => sum + (course.totalQuizzes || 0),
              0
            );
            setTotalQuizzes(total);
          }
        } else {
          const coursesResponse = await fetch('/api/courses');

          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            setAllCourses(coursesData);

            const total = coursesData.reduce(
              (sum: number, course: Course) => sum + (course.totalQuizzes || 0),
              0
            );
            setTotalQuizzes(total);
          }
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
            {isAuthenticated
              ? showAllCourses
                ? 'All Exams'
                : 'Your Practice'
              : 'All Exams'}
          </h1>
          {!loading && isAuthenticated && (
            <div className="space-y-5">
              <p className="quiz-hero-note mx-auto inline-block max-w-3xl rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-base text-[#d4d0dc] backdrop-blur-sm md:text-xl">
                {showAllCourses
                  ? `${allCourses.length} course${allCourses.length !== 1 ? 's' : ''} available · ${accessibleCourses.length} included in your subscription`
                  : accessibleCourses.length > 0
                    ? `${accessibleCourses.length} course${accessibleCourses.length !== 1 ? 's' : ''} included in your subscription`
                    : 'Subscribe to unlock practice for your exam bank'}
              </p>
              {allCourses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllCourses((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[#eeeaf4] transition hover:border-[#f5c14a]/40 hover:bg-[#f5c14a]/10"
                >
                  {showAllCourses ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                      My courses only
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      View all courses
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          {!loading && !isAuthenticated && (
            <p className="quiz-hero-note mx-auto inline-block max-w-3xl rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-base text-[#d4d0dc] backdrop-blur-sm md:text-xl">
              {totalQuizzes} exam{totalQuizzes !== 1 ? 's' : ''} available to test your knowledge and improve your mathematics skills
            </p>
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
        ) : displayedCourses.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  moduleCount={course.moduleCount}
                  totalQuizzes={course.totalQuizzes}
                  slug={course.slug}
                  locked={isAuthenticated && showAllCourses && !accessibleIds.has(course.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="quiz-empty-card inline-block rounded-3xl border border-white/10 bg-[#111121]/90 p-12 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="text-6xl mb-6">{isAuthenticated ? '🔒' : '📚'}</div>
              <h3 className="mb-3 text-2xl font-bold text-[#f5c14a]">
                {isAuthenticated ? 'No course unlocked yet' : 'No Courses Available'}
              </h3>
              <p className="quiz-muted text-lg text-[#c8c3d2]">
                {isAuthenticated
                  ? 'Start your 48h free trial to access your QBank.'
                  : 'Check back soon for new courses!'}
              </p>
              {isAuthenticated && (
                <>
                  {allCourses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCourses(true)}
                      className="mt-6 mr-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-[#eeeaf4] transition hover:border-[#f5c14a]/40 hover:bg-[#f5c14a]/10"
                    >
                      View all courses
                    </button>
                  )}
                  <Link
                    href="/subscribe"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f5c14a] px-6 py-3 font-semibold text-[#0c0a00] transition hover:bg-[#f9d06a]"
                  >
                    Start 48h trial
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
