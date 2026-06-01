import Link from 'next/link';
import { prisma } from '@/lib/db';
import SyncDatabaseError from '@/components/Admin/SyncDatabaseError';
import { formatPrismaDbError } from '@/lib/sync/db-error-message';

export const dynamic = 'force-dynamic';

async function loadSyncPageData() {
  const [logs, publishedCount, outOfDateCount] = await Promise.all([
    prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        quiz: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.quiz.count({ where: { syncPublishStatus: 'PUBLISHED' } }),
    prisma.quiz.count({ where: { syncPublishStatus: 'OUT_OF_DATE' } }),
  ]);
  return { logs, publishedCount, outOfDateCount };
}

export default async function AdminSyncPage() {
  try {
    const { logs, publishedCount, outOfDateCount } = await loadSyncPageData();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Synchronisation → The School
          </h1>
          <p className="text-gray-600">
            Publication des quiz vers le site gratuit ({publishedCount} publiés,{' '}
            {outOfDateCount} à republier)
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
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
                  Statut
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  ID gratuit
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Erreur
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucune synchronisation pour le moment.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {log.createdAt.toLocaleString('fr-FR')}
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
        </div>
      </div>
    );
  } catch (error) {
    return (
      <SyncDatabaseError
        appLabel="quiz-main (payant)"
        message={formatPrismaDbError(error)}
      />
    );
  }
}
