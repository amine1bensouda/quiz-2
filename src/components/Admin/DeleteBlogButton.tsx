'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteBlogButtonProps {
  blogId: string;
  blogTitle: string;
}

export default function DeleteBlogButton({ blogId, blogTitle }: DeleteBlogButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
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
        <span className="text-sm text-[rgba(238,234,244,0.55)]">Confirm?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="rounded-lg border border-white/15 px-3 py-1 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-white/25 hover:bg-white/5"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/25"
      title={`Delete "${blogTitle}"`}
    >
      Delete
    </button>
  );
}
