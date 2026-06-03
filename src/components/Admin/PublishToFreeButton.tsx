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
    className: 'bg-white/10 text-[rgba(238,234,244,0.65)]',
  },
  PUBLISHED: {
    label: 'Published',
    className: 'bg-emerald-500/20 text-emerald-300',
  },
  OUT_OF_DATE: {
    label: 'Out of date',
    className: 'bg-amber-500/20 text-amber-300',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-500/20 text-red-300',
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
    <div className="space-y-3 rounded-xl border border-[#f5c14a]/25 bg-[#f5c14a]/8 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-[#eeeaf4]">Free Site (The School)</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {lastSyncedAt && (
        <p className="text-sm text-[rgba(238,234,244,0.55)]">
          Last sync:{' '}
          {new Date(lastSyncedAt).toLocaleString('en-US')}
          {freeQuizId && (
            <>
              {' '}
              · Free ID:{' '}
              <code className="rounded border border-white/10 bg-[#0e0e1a] px-1 text-xs text-[rgba(238,234,244,0.55)]">
                {freeQuizId}
              </code>
            </>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={handlePublish}
        disabled={loading}
        className="rounded-lg bg-[#f5c14a] px-4 py-2 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a] disabled:opacity-50"
      >
        {loading
          ? 'Publishing...'
          : syncPublishStatus === 'PUBLISHED'
            ? 'Republish to The School'
            : 'Publish to The School'}
      </button>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
