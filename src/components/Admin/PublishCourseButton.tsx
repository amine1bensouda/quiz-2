'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PublishCourseButtonProps {
  courseId: string;
  courseTitle: string;
  currentStatus: 'published' | 'draft';
}

export default function PublishCourseButton({
  courseId,
  courseTitle,
  currentStatus,
}: PublishCourseButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>(currentStatus);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleToggleStatus = async () => {
    if (isLoading) return;

    const newStatus = status === 'published' ? 'draft' : 'published';
    const confirmMessage =
      newStatus === 'published'
        ? `Publish course "${courseTitle}"?`
        : `Set course "${courseTitle}" to draft?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        let errorMessage = 'Error updating';
        try {
          const error = await response.json();
          errorMessage = error.error || error.details || errorMessage;
        } catch (e) {
          errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const updatedCourse = await response.json();
      setStatus(updatedCourse.status || newStatus);
      router.refresh();
    } catch (error: any) {
      console.error('Course publish error:', error);
      alert(`Error: ${error.message || 'An error occurred while updating the course'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleStatus}
      disabled={isLoading}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        status === 'published'
          ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
          : 'border border-white/15 bg-white/5 text-[rgba(238,234,244,0.75)] hover:border-white/25'
      } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
      title={status === 'published' ? 'Click to set to draft' : 'Click to publish'}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          {status === 'published' ? 'Unpublishing...' : 'Publishing...'}
        </span>
      ) : status === 'published' ? (
        '✅ Published'
      ) : (
        '📝 Draft'
      )}
    </button>
  );
}
