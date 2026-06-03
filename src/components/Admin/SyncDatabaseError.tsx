import type { DbErrorInfo } from '@/lib/sync/db-error-message';

type Props = {
  appLabel: string;
  errorInfo: DbErrorInfo;
};

export default function SyncDatabaseError({ appLabel, errorInfo }: Props) {
  const title =
    errorInfo.kind === 'missing_migration'
      ? 'Migrations required'
      : 'Database issue';

  return (
    <div className="max-w-2xl space-y-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-[#eeeaf4]">
      <h1 className="text-xl font-bold text-red-200">
        {title} — {appLabel}
      </h1>
      <p className="whitespace-pre-wrap text-sm text-red-100/90">
        {errorInfo.message}
      </p>
      <div className="space-y-2 rounded-lg border border-red-500/30 bg-[#12121f] p-4 text-sm text-[rgba(238,234,244,0.75)]">
        <p className="font-semibold">On the VPS:</p>
        <ol className="list-decimal list-inside space-y-1">
          {errorInfo.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
