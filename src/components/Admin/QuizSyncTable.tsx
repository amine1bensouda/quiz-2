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
  NOT_PUBLISHED: { label: 'Non publié', className: 'bg-gray-100 text-gray-700' },
  PUBLISHED: { label: 'Publié', className: 'bg-emerald-100 text-emerald-800' },
  OUT_OF_DATE: { label: 'À republier', className: 'bg-amber-100 text-amber-900' },
  FAILED: { label: 'Échec', className: 'bg-red-100 text-red-800' },
};

export default function QuizSyncTable({ quizzes }: { quizzes: QuizSyncRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const publish = async (quiz: QuizSyncRow) => {
    const msg =
      quiz.syncPublishStatus === 'PUBLISHED'
        ? `Republier « ${quiz.title} » vers The School ?`
        : `Publier « ${quiz.title} » vers The School ?`;
    if (!window.confirm(msg)) return;

    setLoadingId(quiz.id);
    setFeedback((f) => ({ ...f, [quiz.id]: '' }));

    try {
      const res = await fetch(
        `/api/admin/quizzes/${encodeURIComponent(quiz.id)}/publish-to-free`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec');
      setFeedback((f) => ({
        ...f,
        [quiz.id]: data.alreadyUpToDate
          ? 'Déjà à jour'
          : `OK — ID gratuit : ${data.freeQuizId}`,
      }));
      router.refresh();
    } catch (e) {
      setFeedback((f) => ({
        ...f,
        [quiz.id]: e instanceof Error ? e.message : 'Erreur',
      }));
    } finally {
      setLoadingId(null);
    }
  };

  if (quizzes.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-gray-500">Aucun quiz en base.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Quiz</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut sync</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {quizzes.map((q) => {
            const st = STATUS[q.syncPublishStatus] ?? STATUS.NOT_PUBLISHED;
            const fb = feedback[q.id];
            return (
              <tr key={q.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-medium text-gray-900">{q.title}</td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-gray-100 px-1 rounded">{q.slug}</code>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.className}`}
                  >
                    {st.label}
                  </span>
                  {q.lastSyncedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(q.lastSyncedAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={loadingId === q.id}
                      onClick={() => publish(q)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loadingId === q.id
                        ? '…'
                        : q.syncPublishStatus === 'PUBLISHED'
                          ? 'Republier'
                          : 'Publier'}
                    </button>
                    <Link
                      href={`/admin/quizzes/${q.id}/edit`}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Éditer
                    </Link>
                  </div>
                  {fb && (
                    <p
                      className={`text-xs ${fb.startsWith('OK') ? 'text-emerald-700' : fb === 'Déjà à jour' ? 'text-gray-600' : 'text-red-600'}`}
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
