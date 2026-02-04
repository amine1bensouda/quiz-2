import LoadingSpinner from '@/components/Layout/LoadingSpinner';

export default function QuizDetailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white py-12">
      <div className="flex flex-col items-center gap-6">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg mb-2">Loading quiz...</p>
          <p className="text-gray-600 text-sm">Preparing your quiz experience</p>
        </div>
      </div>
    </div>
  );
}






