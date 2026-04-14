import Navigation from '@/components/Layout/Navigation';
import BackgroundPattern from '@/components/Layout/BackgroundPattern';
import LoadingSpinner from '@/components/Layout/LoadingSpinner';

export default function LessonLoading() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50">
      <BackgroundPattern variant="luxury" opacity={0.08} />
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl relative z-10">
        <div className="mb-6 h-4 w-64 bg-gray-200 rounded-full animate-pulse" />

        <article className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xl overflow-hidden">
          <div className="aspect-video w-full bg-gray-200 animate-pulse" />

          <div className="p-6 sm:p-8">
            <div className="h-9 w-3/4 bg-gray-200 rounded-xl animate-pulse mb-6" />

            <div className="space-y-3 mb-8">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-11/12 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-10/12 bg-gray-100 rounded animate-pulse" />
            </div>

            <div className="h-12 w-44 bg-indigo-100 rounded-lg animate-pulse" />
          </div>
        </article>

        <div className="mt-8 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    </div>
  );
}
