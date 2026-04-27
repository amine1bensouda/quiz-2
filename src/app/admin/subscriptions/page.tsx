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
      return 'bg-blue-100 text-blue-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'past_due':
      return 'bg-amber-100 text-amber-800';
    case 'canceled':
      return 'bg-gray-200 text-gray-700';
    case 'expired':
      return 'bg-gray-200 text-gray-700';
    case 'incomplete':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-700';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Subscriptions
          </h1>
          <p className="text-gray-600">
            {totalAll} total subscriptions — {totalActive} active
          </p>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-3 items-end bg-white rounded-2xl shadow border border-gray-200 p-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={status || ''}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Plan
          </label>
          <select
            name="plan"
            defaultValue={plan || ''}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
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
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Apply
        </button>
        {(status || plan) && (
          <Link
            href="/admin/subscriptions"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No subscriptions match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Trial end
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Period end
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.map((sub) => {
                  const planDef = getPlan(sub.plan);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {sub.user?.name || '—'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sub.user?.email || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {planDef?.label || sub.plan}
                        </div>
                        {planDef && (
                          <div className="text-xs text-gray-500">
                            {formatPlanPrice(planDef)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sub.course ? (
                          <Link
                            href={`/quiz/course/${sub.course.slug}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {sub.course.title}
                          </Link>
                        ) : sub.plan === 'ALL_ACCESS' ? (
                          <span className="text-gray-500">All courses</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                        {sub.provider}
                        {sub.cancelAtPeriodEnd && (
                          <div className="text-xs text-amber-700">
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
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(sub.trialEndsAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(sub.currentPeriodEnd)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
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
