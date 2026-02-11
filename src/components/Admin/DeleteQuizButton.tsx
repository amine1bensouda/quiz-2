'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteQuizButtonProps {
  quizId: string;
  quizTitle: string;
}

export default function DeleteQuizButton({ quizId, quizTitle }: DeleteQuizButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Error deleting');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Confirm?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      title={`Delete "${quizTitle}"`}
    >
      Delete
    </button>
  );
}
