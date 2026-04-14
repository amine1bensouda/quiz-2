import Navigation from '@/components/Layout/Navigation';
import AnimatedShapes from '@/components/Layout/AnimatedShapes';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';

export default function CourseLoading() {
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50 min-h-screen">
      <AnimatedShapes variant="hero" count={6} intensity="medium" />
      <BackgroundPattern variant="luxury" opacity={0.08} />
      <Navigation />

      <div className="container mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 md:py-12 relative z-10 max-w-[100vw]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 h-4 w-56 bg-gray-200 rounded-full animate-pulse" />

          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xl shadow-indigo-900/5 p-6 sm:p-8 md:p-10 mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="h-6 w-24 rounded-full bg-indigo-100 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-violet-100 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-emerald-100 animate-pulse" />
            </div>
            <div className="h-9 sm:h-11 w-3/4 bg-gray-200 rounded-xl animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-11/12 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white/90 border border-gray-200/80 shadow-md p-5"
              >
                <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((__, cardIdx) => (
                    <div
                      key={cardIdx}
                      className="h-24 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
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
