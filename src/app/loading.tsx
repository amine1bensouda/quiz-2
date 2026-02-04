import LoadingSpinner from '@/components/Layout/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="flex flex-col items-center gap-6">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg mb-2">Loading page...</p>
          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}






