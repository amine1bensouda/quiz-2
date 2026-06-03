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

export default async function AdminSyncPage() {
  const missingEnv = getMissingSyncEnvVars();

  try {
    const { logs, publishedCount, outOfDateCount, quizzes } =
      await loadSyncPageData();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Synchronization -&gt; The School
          </h1>
          <p className="text-gray-600">
            Choose a quiz below and click <strong>Publish</strong> to send it to
            theschoolofmathematics.com ({publishedCount} published, {outOfDateCount}{' '}
            out of date).
          </p>
        </div>

        {missingEnv.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Incomplete sync configuration (.env)</p>
            <p className="mt-1">
              Missing variables on server:{' '}
              <code>{missingEnv.join(', ')}</code>
            </p>
            <p className="mt-2 text-amber-800">
              Add them to <code>/var/www/quizz/.env</code>, then use the same keys on
              school (<code>SYNC_API_KEY</code>, <code>SYNC_HMAC_SECRET</code>), and run{' '}
              <code>pm2 restart quiz --update-env</code>.
            </p>
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900">Quizzes to publish</h2>
            <Link
              href="/admin/quizzes"
              className="text-sm text-indigo-600 hover:underline font-medium"
            >
              All quizzes -&gt;
            </Link>
          </div>
          <QuizSyncTable
            quizzes={quizzes.map((q) => ({
              ...q,
              lastSyncedAt: q.lastSyncedAt?.toISOString() ?? null,
            }))}
          />
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <h2 className="px-4 py-3 font-semibold text-gray-900 border-b bg-gray-50">
            Sync history
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Quiz
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Free ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No sync attempts yet — use the Publish button above.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {log.createdAt.toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-3">
                      {log.quiz ? (
                        <Link
                          href={`/admin/quizzes/${log.quiz.id}/edit`}
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          {log.quiz.title}
                        </Link>
                      ) : (
                        log.quizId
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'pending'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.freeQuizId ? (
                        <code className="text-xs">{log.freeQuizId}</code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate">
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
