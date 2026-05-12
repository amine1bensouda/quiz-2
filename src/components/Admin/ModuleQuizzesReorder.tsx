'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type ModuleQuizRow = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface ModuleQuizzesReorderProps {
  moduleId: string;
  quizzes: ModuleQuizRow[];
}

export default function ModuleQuizzesReorder({ moduleId, quizzes: initialQuizzes }: ModuleQuizzesReorderProps) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const reorder = async (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= quizzes.length) return;

    const next = [...quizzes];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    const quizIds = next.map((q) => q.id);

    setLoadingId(removed.id);
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}/quizzes/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not update order');
      }
      setQuizzes(next.map((q, i) => ({ ...q, order: i })));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoadingId(null);
    }
  };

  if (quizzes.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No quizzes in this module. Create a quiz and assign it to this module to reorder it.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quizzes.map((quiz, index) => (
              <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => reorder(index, 'up')}
                      disabled={index === 0 || loadingId !== null}
                      className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => reorder(index, 'down')}
                      disabled={index === quizzes.length - 1 || loadingId !== null}
                      className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{quiz.title}</td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{quiz.slug}</code>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/quizzes/${encodeURIComponent(quiz.slug)}/edit`}
                    className="text-sm font-semibold text-amber-700 hover:text-amber-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
