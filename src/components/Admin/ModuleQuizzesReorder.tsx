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
      <p className="text-sm text-[rgba(238,234,244,0.5)]">
        No quizzes in this module. Create a quiz and assign it to this module to reorder it.
      </p>
    );
  }

  const arrowBtn =
    'rounded-lg border border-white/15 bg-[#0e0e1a] p-1.5 text-[rgba(238,234,244,0.75)] transition-colors hover:border-[#f5c14a]/40 hover:text-[#f5c14a] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-[#0e0e1a]">
            <tr>
              <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Slug
              </th>
              <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {quizzes.map((quiz, index) => (
              <tr key={quiz.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => reorder(index, 'up')}
                      disabled={index === 0 || loadingId !== null}
                      className={arrowBtn}
                      title="Move up"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => reorder(index, 'down')}
                      disabled={index === quizzes.length - 1 || loadingId !== null}
                      className={arrowBtn}
                      title="Move down"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-[#eeeaf4]">{quiz.title}</td>
                <td className="px-4 py-3">
                  <code className="rounded border border-white/10 bg-[#0e0e1a] px-2 py-1 text-xs text-[rgba(238,234,244,0.55)]">
                    {quiz.slug}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/quizzes/${encodeURIComponent(quiz.slug)}/edit`}
                    className="text-sm font-semibold text-[#f5c14a] hover:text-[#f9d06a]"
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
