import type { DbErrorInfo } from '@/lib/sync/db-error-message';

type Props = {
  appLabel: string;
  errorInfo: DbErrorInfo;
};

export default function SyncDatabaseError({ appLabel, errorInfo }: Props) {
  const title =
    errorInfo.kind === 'missing_migration'
      ? 'Migrations à appliquer'
      : 'Problème base de données';

  return (
    <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4">
      <h1 className="text-xl font-bold text-red-900">
        {title} — {appLabel}
      </h1>
      <p className="text-sm text-red-800 whitespace-pre-wrap">
        {errorInfo.message}
      </p>
      <div className="text-sm text-gray-800 space-y-2 bg-white rounded-lg p-4 border border-red-100">
        <p className="font-semibold">Sur le VPS :</p>
        <ol className="list-decimal list-inside space-y-1">
          {errorInfo.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
