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
        throw new Error(data.error || 'Erreur lors du réordonnancement');
      }
      setModules(newOrder.map((m, i) => ({ ...m, order: i })));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                Ordre
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Quiz
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {modules.map((module, index) => (
              <tr key={module.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => reorder(index, 'up')}
                      disabled={index === 0 || loading !== null}
                      className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                      title="Monter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => reorder(index, 'down')}
                      disabled={index === modules.length - 1 || loading !== null}
                      className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                      title="Descendre"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{module.title}</div>
                  {module.description && (
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">{module.description}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {module.course.title}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{module.slug}</code>
                </td>
                <td className="px-6 py-4 text-gray-700">{module._count.quizzes}</td>
                <td className="px-6 py-4 text-gray-700">{module.order}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/modules/${module.id}/edit`}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
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
