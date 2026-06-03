import Link from 'next/link';
import { prisma } from '@/lib/db';
import QuizSyncTable from '@/components/Admin/QuizSyncTable';
import SyncDatabaseError from '@/components/Admin/SyncDatabaseError';
import { getMissingSyncEnvVars } from '@/lib/sync/env-check';
import { formatPrismaDbError } from '@/lib/sync/db-error-message';

export const dynamic = 'force-dynamic';

async function loadSyncPageData() {
  const [logs, publishedCount, outOfDateCount, quizzes] = await Promise.all([
    prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        quiz: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.quiz.count({ where: { syncPublishStatus: 'PUBLISHED' } }),
    prisma.quiz.count({ where: { syncPublishStatus: 'OUT_OF_DATE' } }),
    prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        syncPublishStatus: true,
        lastSyncedAt: true,
        freeQuizId: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 80,
    }),
  ]);
  return { logs, publishedCount, outOfDateCount, quizzes };
}

function logStatusClass(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-emerald-500/20 text-emerald-300';
    case 'pending':
      return 'bg-white/10 text-[rgba(238,234,244,0.65)]';
    default:
      return 'bg-red-500/20 text-red-300';
  }
}

export default async function AdminSyncPage() {
  const missingEnv = getMissingSyncEnvVars();

  try {
    const { logs, publishedCount, outOfDateCount, quizzes } =
      await loadSyncPageData();

    return (
      <div className="space-y-6 text-[#eeeaf4]">
        <div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
            Synchronization → The School
          </h1>
          <p className="text-[rgba(238,234,244,0.55)]">
            Choose a quiz below and click <strong className="text-[#eeeaf4]">Publish</strong> to send it to
            theschoolofmathematics.com ({publishedCount} published, {outOfDateCount}{' '}
            out of date).
          </p>
        </div>

        {missingEnv.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="font-semibold">Incomplete sync configuration (.env)</p>
            <p className="mt-1 text-amber-100/90">
              Missing variables on server:{' '}
              <code className="rounded border border-white/10 bg-[#0e0e1a] px-1">{missingEnv.join(', ')}</code>
            </p>
            <p className="mt-2 text-amber-100/80">
              Add them to <code className="rounded border border-white/10 bg-[#0e0e1a] px-1">/var/www/quizz/.env</code>, then use the same keys on
              school (<code className="rounded border border-white/10 bg-[#0e0e1a] px-1">SYNC_API_KEY</code>,{' '}
              <code className="rounded border border-white/10 bg-[#0e0e1a] px-1">SYNC_HMAC_SECRET</code>), and run{' '}
              <code className="rounded border border-white/10 bg-[#0e0e1a] px-1">pm2 restart quiz --update-env</code>.
            </p>
          </div>
        )}

        <section className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0e0e1a] px-4 py-3">
            <h2 className="font-semibold text-[#eeeaf4]">Quizzes to publish</h2>
            <Link
              href="/admin/quizzes"
              className="text-sm font-medium text-[#f5c14a] hover:underline"
            >
              All quizzes →
            </Link>
          </div>
          <QuizSyncTable
            quizzes={quizzes.map((q) => ({
              ...q,
              lastSyncedAt: q.lastSyncedAt?.toISOString() ?? null,
            }))}
          />
        </section>

        <section className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
          <h2 className="border-b border-white/10 bg-[#0e0e1a] px-4 py-3 font-semibold text-[#eeeaf4]">
            Sync history
          </h2>
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-[#0e0e1a]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">
                  Quiz
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">
                  Free ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[rgba(238,234,244,0.55)]">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[rgba(238,234,244,0.45)]">
                    No sync attempts yet — use the Publish button above.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-3 text-[rgba(238,234,244,0.55)]">
                      {log.createdAt.toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-3">
                      {log.quiz ? (
                        <Link
                          href={`/admin/quizzes/${log.quiz.id}/edit`}
                          className="font-medium text-[#f5c14a] hover:underline"
                        >
                          {log.quiz.title}
                        </Link>
                      ) : (
                        log.quizId
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${logStatusClass(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.freeQuizId ? (
                        <code className="rounded border border-white/10 bg-[#0e0e1a] px-1 text-xs text-[rgba(238,234,244,0.55)]">
                          {log.freeQuizId}
                        </code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-red-300">
                      {log.errorMessage || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  } catch (error) {
    return (
      <SyncDatabaseError
        appLabel="Crack The Curve (paid)"
        errorInfo={formatPrismaDbError(error)}
      />
    );
  }
}
