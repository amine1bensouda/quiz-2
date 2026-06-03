import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatPlanPrice, getPlan } from '@/lib/plans';

export const dynamic = 'force-dynamic';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'expired', label: 'Expired' },
  { value: 'incomplete', label: 'Incomplete' },
];

const PLAN_OPTIONS = [
  { value: '', label: 'All plans' },
  { value: 'SINGLE_COURSE', label: 'Single course' },
  { value: 'ALL_ACCESS', label: 'All access' },
];

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function statusBadge(status: string): string {
  switch (status) {
    case 'trialing':
      return 'bg-blue-500/20 text-blue-300';
    case 'active':
      return 'bg-emerald-500/20 text-emerald-300';
    case 'past_due':
      return 'bg-amber-500/20 text-amber-300';
    case 'canceled':
      return 'bg-white/10 text-[rgba(238,234,244,0.55)]';
    case 'expired':
      return 'bg-white/10 text-[rgba(238,234,244,0.55)]';
    case 'incomplete':
      return 'bg-yellow-500/20 text-yellow-300';
    default:
      return 'bg-white/10 text-[rgba(238,234,244,0.65)]';
  }
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams?: { status?: string; plan?: string };
}) {
  const status = searchParams?.status?.trim() || undefined;
  const plan = searchParams?.plan?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (plan) where.plan = plan;

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, name: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
  });

  const totalAll = await prisma.subscription.count();
  const totalActive = await prisma.subscription.count({
    where: { status: { in: ['trialing', 'active', 'past_due'] } },
  });

  const inputClass =
    'rounded-xl border border-white/10 bg-[#0e0e1a] px-3 py-2 text-sm text-[#eeeaf4] focus:border-[#f5c14a]/60 focus:outline-none focus:ring-2 focus:ring-[#f5c14a]/20';

  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
            Subscriptions
          </h1>
          <p className="text-[rgba(238,234,244,0.55)]">
            {totalAll} total subscriptions — {totalActive} active
          </p>
        </div>
      </div>

      <form
        method="get"
        className="admin-surface flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#12121f] p-4 shadow-lg"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-[rgba(238,234,244,0.75)]">
            Status
          </label>
          <select
            name="status"
            defaultValue={status || ''}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[rgba(238,234,244,0.75)]">
            Plan
          </label>
          <select
            name="plan"
            defaultValue={plan || ''}
            className={inputClass}
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#f5c14a] px-4 py-2 text-sm font-semibold text-[#0c0a00] transition-colors hover:bg-[#f9d06a]"
        >
          Apply
        </button>
        {(status || plan) && (
          <Link
            href="/admin/subscriptions"
            className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-[rgba(238,234,244,0.45)]">
            No subscriptions match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-[#0e0e1a]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Trial end
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Period end
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {subscriptions.map((sub) => {
                  const planDef = getPlan(sub.plan);
                  return (
                    <tr key={sub.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-[#eeeaf4]">
                          {sub.user?.name || '—'}
                        </div>
                        <div className="text-xs text-[rgba(238,234,244,0.45)]">
                          {sub.user?.email || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#eeeaf4]">
                          {planDef?.label || sub.plan}
                        </div>
                        {planDef && (
                          <div className="text-xs text-[rgba(238,234,244,0.45)]">
                            {formatPlanPrice(planDef)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[rgba(238,234,244,0.75)]">
                        {sub.course ? (
                          <Link
                            href={`/quiz/course/${sub.course.slug}`}
                            className="text-[#f5c14a] hover:underline"
                          >
                            {sub.course.title}
                          </Link>
                        ) : sub.plan === 'ALL_ACCESS' ? (
                          <span className="text-[rgba(238,234,244,0.45)]">All courses</span>
                        ) : (
                          <span className="text-[rgba(238,234,244,0.35)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-[rgba(238,234,244,0.75)]">
                        {sub.provider}
                        {sub.cancelAtPeriodEnd && (
                          <div className="text-xs text-amber-300">
                            cancel at period end
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge(
                            sub.status
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[rgba(238,234,244,0.75)]">
                        {formatDate(sub.trialEndsAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[rgba(238,234,244,0.75)]">
                        {formatDate(sub.currentPeriodEnd)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[rgba(238,234,244,0.45)]">
                        {formatDate(sub.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
