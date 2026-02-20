'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ModuleItem = {
  id: string;
  title: string;
  _count: { quizzes: number };
};

interface CourseModulesDraggableProps {
  courseId: string;
  modules: ModuleItem[];
}

export default function CourseModulesDraggable({ courseId, modules: initialModules }: CourseModulesDraggableProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== id) setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedId(null);
      return;
    }

    const fromIndex = modules.findIndex((m) => m.id === sourceId);
    const toIndex = modules.findIndex((m) => m.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newOrder = [...modules];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setModules(newOrder);
    setDraggedId(null);

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds: newOrder.map((m) => m.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.details === 'string' ? data.details : data.error || 'Erreur lors de la mise à jour');
      }
      router.refresh();
    } catch (err) {
      setModules(initialModules);
      alert(err instanceof Error ? err.message : 'Erreur lors du réordonnancement. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Modules:
        {modules.length > 0 && (
          <span className="ml-2 text-gray-500 font-normal">
            Glissez une carte pour modifier l&apos;ordre
          </span>
        )}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map((module) => (
          <div
            key={module.id}
            draggable
            onDragStart={(e) => handleDragStart(e, module.id)}
            onDragOver={(e) => handleDragOver(e, module.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, module.id)}
            onDragEnd={handleDragEnd}
            className={`
              bg-gray-50 rounded-lg p-3 border cursor-grab active:cursor-grabbing
              transition-all duration-150
              ${draggedId === module.id ? 'opacity-50 scale-95 shadow-lg' : ''}
              ${dragOverId === module.id ? 'ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50' : 'border-gray-200'}
              ${saving ? 'pointer-events-none' : ''}
            `}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400 select-none flex-shrink-0" title="Glisser pour réordonner">
                  ⋮⋮
                </span>
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{module.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {module._count.quizzes} quiz
                  </p>
                </div>
              </div>
              <Link
                href={`/admin/modules/${module.id}/edit`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
