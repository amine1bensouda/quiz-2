'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  quizId: string;
  quizTitle: string;
  syncPublishStatus: string;
  lastSyncedAt: string | null;
  freeQuizId: string | null;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NOT_PUBLISHED: {
    label: 'Not published',
    className: 'bg-gray-100 text-gray-700',
  },
  PUBLISHED: {
    label: 'Published',
    className: 'bg-emerald-100 text-emerald-800',
  },
  OUT_OF_DATE: {
    label: 'Out of date',
    className: 'bg-amber-100 text-amber-900',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800',
  },
};

export default function PublishToFreeButton({
  quizId,
  quizTitle,
  syncPublishStatus,
  lastSyncedAt,
  freeQuizId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status =
    STATUS_LABELS[syncPublishStatus] ?? STATUS_LABELS.NOT_PUBLISHED;

  const handlePublish = async () => {
    const confirmMsg =
      syncPublishStatus === 'PUBLISHED'
        ? `Republish "${quizTitle}" to The School? Premium changes will overwrite free-site content unless local edits are locked.`
        : `Publish "${quizTitle}" to The School (free site)?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/quizzes/${encodeURIComponent(quizId)}/publish-to-free`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Publishing failed');
      }

      setMessage(
        data.alreadyUpToDate
          ? 'Already up to date on the free site.'
          : `Published successfully (Free ID: ${data.freeQuizId}).`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-gray-900">Free Site (The School)</h3>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {lastSyncedAt && (
        <p className="text-sm text-gray-600">
          Last sync:{' '}
          {new Date(lastSyncedAt).toLocaleString('en-US')}
          {freeQuizId && (
            <>
              {' '}
              · Free ID:{' '}
              <code className="text-xs bg-white px-1 rounded">{freeQuizId}</code>
            </>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={handlePublish}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading
          ? 'Publishing...'
          : syncPublishStatus === 'PUBLISHED'
            ? 'Republish to The School'
            : 'Publish to The School'}
      </button>

      {message && (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
