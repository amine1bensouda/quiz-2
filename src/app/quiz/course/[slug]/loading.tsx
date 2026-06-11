import Navigation from '@/components/Layout/Navigation';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';

export default function CourseLoading() {
  return (
    <div className="quiz-page relative min-h-screen overflow-hidden bg-[#080810] text-[#eeeaf4]">
      <AnimatedShapes variant="hero" count={6} intensity="medium" />
      <BackgroundPattern variant="luxury" opacity={0.06} />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#f5c14a]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-3rem] top-40 h-80 w-80 rounded-full bg-[#b388ff]/15 blur-3xl" />
      <Navigation />

      <div className="container relative z-10 mx-auto max-w-[100vw] px-4 py-8 sm:px-5 sm:py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 h-4 w-56 animate-pulse rounded-full bg-white/10" />

          <div className="course-hero mb-8 rounded-2xl border border-white/10 bg-[#111121]/85 p-6 sm:rounded-3xl sm:p-8 md:p-10">
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="mb-4 h-9 w-3/4 animate-pulse rounded-xl bg-white/10 sm:h-11" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-white/5" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-white/5" />
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="course-accordion rounded-2xl border border-white/10 bg-[#111121]/85 p-5 shadow-md"
              >
                <div className="mb-4 h-6 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((__, cardIdx) => (
                    <div
                      key={cardIdx}
                      className="h-24 animate-pulse rounded-xl border border-white/10 bg-[#141424]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
