'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export type QuizSyncRow = {
  id: string;
  title: string;
  slug: string;
  syncPublishStatus: string;
  lastSyncedAt: string | null;
  freeQuizId: string | null;
};

const STATUS: Record<string, { label: string; className: string }> = {
  NOT_PUBLISHED: { label: 'Not published', className: 'bg-white/10 text-[rgba(238,234,244,0.65)]' },
  PUBLISHED: { label: 'Published', className: 'bg-emerald-500/20 text-emerald-300' },
  OUT_OF_DATE: { label: 'Out of date', className: 'bg-amber-500/20 text-amber-300' },
  FAILED: { label: 'Failed', className: 'bg-red-500/20 text-red-300' },
};

export default function QuizSyncTable({ quizzes }: { quizzes: QuizSyncRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const publish = async (quiz: QuizSyncRow) => {
    const msg =
      quiz.syncPublishStatus === 'PUBLISHED'
        ? `Republish "${quiz.title}" to The School?`
        : `Publish "${quiz.title}" to The School?`;
    if (!window.confirm(msg)) return;

    setLoadingId(quiz.id);
    setFeedback((f) => ({ ...f, [quiz.id]: '' }));

    try {
      const res = await fetch(
        `/api/admin/quizzes/${encodeURIComponent(quiz.id)}/publish-to-free`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setFeedback((f) => ({
        ...f,
        [quiz.id]: data.alreadyUpToDate
          ? 'Already up to date'
          : `OK — Free ID: ${data.freeQuizId}`,
      }));
      router.refresh();
    } catch (e) {
      setFeedback((f) => ({
        ...f,
        [quiz.id]: e instanceof Error ? e.message : 'Error',
      }));
    } finally {
      setLoadingId(null);
    }
  };

  if (quizzes.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[rgba(238,234,244,0.45)]">No quizzes found.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 bg-[#0e0e1a]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">Quiz</th>
            <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">Slug</th>
            <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">Sync status</th>
            <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {quizzes.map((q) => {
            const st = STATUS[q.syncPublishStatus] ?? STATUS.NOT_PUBLISHED;
            const fb = feedback[q.id];
            return (
              <tr key={q.id} className="align-top transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-[#eeeaf4]">{q.title}</td>
                <td className="px-4 py-3">
                  <code className="rounded border border-white/10 bg-[#0e0e1a] px-1 text-xs text-[rgba(238,234,244,0.55)]">
                    {q.slug}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}
                  >
                    {st.label}
                  </span>
                  {q.lastSyncedAt && (
                    <p className="mt-1 text-xs text-[rgba(238,234,244,0.45)]">
                      {new Date(q.lastSyncedAt).toLocaleString('en-US')}
                    </p>
                  )}
                </td>
                <td className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={loadingId === q.id}
                      onClick={() => publish(q)}
                      className="rounded-lg bg-[#f5c14a] px-3 py-1.5 text-xs font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a] disabled:opacity-50"
                    >
                      {loadingId === q.id
                        ? '…'
                        : q.syncPublishStatus === 'PUBLISHED'
                          ? 'Republish'
                          : 'Publish'}
                    </button>
                    <Link
                      href={`/admin/quizzes/${q.id}/edit`}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                    >
                      Edit
                    </Link>
                  </div>
                  {fb && (
                    <p
                      className={`text-xs ${fb.startsWith('OK') ? 'text-emerald-300' : fb === 'Already up to date' ? 'text-[rgba(238,234,244,0.55)]' : 'text-red-300'}`}
                    >
                      {fb}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
