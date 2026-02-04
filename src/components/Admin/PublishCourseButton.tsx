'use client';

import { useState } from 'react';
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

  const handleToggleStatus = async () => {
    if (isLoading) return;

    const newStatus = status === 'published' ? 'draft' : 'published';
    const confirmMessage =
      newStatus === 'published'
        ? `Publier le cours "${courseTitle}" ?`
        : `Mettre le cours "${courseTitle}" en brouillon ?`;

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
        let errorMessage = 'Erreur lors de la mise à jour';
        try {
          const error = await response.json();
          errorMessage = error.error || error.details || errorMessage;
        } catch (e) {
          errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const updatedCourse = await response.json();
      setStatus(updatedCourse.status || newStatus);
      router.refresh();
    } catch (error: any) {
      console.error('Erreur publication cours:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue lors de la mise à jour du cours'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleStatus}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
        status === 'published'
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-400 text-white hover:bg-gray-500'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={status === 'published' ? 'Cliquer pour mettre en brouillon' : 'Cliquer pour publier'}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          {status === 'published' ? 'Dépublication...' : 'Publication...'}
        </span>
      ) : status === 'published' ? (
        '✅ Publié'
      ) : (
        '📝 Brouillon'
      )}
    </button>
  );
}
