'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  courseId: string;
  courseTitle: string;
  totalQuizzes: number;
};

export default function PublishCourseToFreeButton({
  courseId,
  courseTitle,
  totalQuizzes,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublishCourse = async () => {
    if (totalQuizzes <= 0) {
      setError('This course has no quizzes to publish.');
      return;
    }

    const confirmed = window.confirm(
      `Publish course "${courseTitle}"? (${totalQuizzes} quizzes will be synced to The School)`
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/courses/${encodeURIComponent(courseId)}/publish-to-free`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish course');
      }

      setMessage(
        data.message ||
          `Done: ${data.published} published, ${data.alreadyUpToDate} up to date, ${data.failed} failed.`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handlePublishCourse}
        disabled={loading || totalQuizzes <= 0}
        className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
        title="Publish all quizzes from this course to The School"
      >
        {loading ? 'Publishing course...' : `Publish course (${totalQuizzes})`}
      </button>
      {message && <p className="text-xs text-emerald-700">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
