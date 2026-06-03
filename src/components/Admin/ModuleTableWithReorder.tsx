'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeleteModuleButton from './DeleteModuleButton';

type ModuleRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  course: { title: string };
  _count: { quizzes: number };
};

interface ModuleTableWithReorderProps {
  modules: ModuleRow[];
  courseId: string;
}

export default function ModuleTableWithReorder({ modules: initialModules, courseId }: ModuleTableWithReorderProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [loading, setLoading] = useState<string | null>(null);

  const reorder = async (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= modules.length) return;

    const newOrder = [...modules];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    const moduleIds = newOrder.map((m) => m.id);

    setLoading(removed.id);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error reordering');
      }
      setModules(newOrder.map((m, i) => ({ ...m, order: i })));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(null);
    }
  };

  const arrowBtn =
    'rounded-lg border border-white/15 bg-[#0e0e1a] p-1.5 text-[rgba(238,234,244,0.75)] transition-colors hover:border-[#f5c14a]/40 hover:text-[#f5c14a] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="admin-surface overflow-hidden rounded-2xl border border-white/10 bg-[#12121f] shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-[#0e0e1a]">
            <tr>
              <th className="w-20 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Order
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Course
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Slug
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Quiz
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Order
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[rgba(238,234,244,0.55)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {modules.map((module, index) => (
              <tr key={module.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => reorder(index, 'up')}
                      disabled={index === 0 || loading !== null}
                      className={arrowBtn}
                      title="Move up"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => reorder(index, 'down')}
                      disabled={index === modules.length - 1 || loading !== null}
                      className={arrowBtn}
                      title="Move down"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-[#eeeaf4]">{module.title}</div>
                  {module.description && (
                    <div className="mt-1 line-clamp-1 text-sm text-[rgba(238,234,244,0.45)]">
                      {module.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full border border-[#b388ff]/30 bg-[#b388ff]/15 px-3 py-1 text-xs font-medium text-[#d4b8ff]">
                    {module.course.title}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <code className="rounded border border-white/10 bg-[#0e0e1a] px-2 py-1 text-xs text-[rgba(238,234,244,0.55)]">
                    {module.slug}
                  </code>
                </td>
                <td className="px-6 py-4 text-[rgba(238,234,244,0.75)]">{module._count.quizzes}</td>
                <td className="px-6 py-4 text-[rgba(238,234,244,0.75)]">{module.order}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/modules/${module.id}/edit`}
                      className="rounded-lg border border-white/15 px-3 py-1 text-sm font-medium text-[#eeeaf4] transition-colors hover:border-[#f5c14a]/50 hover:text-[#f5c14a]"
                    >
                      Edit
                    </Link>
                    <DeleteModuleButton moduleId={module.id} moduleTitle={module.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
