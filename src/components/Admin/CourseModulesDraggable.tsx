'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ModuleItem = {
  id: string;
  title: string;
  _count: { quizzes: number; lessons?: number };
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
        throw new Error(typeof data.details === 'string' ? data.details : data.error || 'Error updating order');
      }
      router.refresh();
    } catch (err) {
      setModules(initialModules);
      alert(err instanceof Error ? err.message : 'Error reordering. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <h3 className="mb-3 text-sm font-semibold text-[rgba(238,234,244,0.75)]">
        Modules:
        {modules.length > 0 && (
          <span className="ml-2 font-normal text-[rgba(238,234,244,0.45)]">
            Drag a card to reorder
          </span>
        )}
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
              cursor-grab rounded-lg border bg-[#0e0e1a] p-3 transition-all duration-150 active:cursor-grabbing
              ${draggedId === module.id ? 'scale-95 opacity-50 shadow-lg' : ''}
              ${dragOverId === module.id ? 'border-[#f5c14a]/50 bg-[#16162a] ring-2 ring-[#f5c14a]/30' : 'border-white/10'}
              ${saving ? 'pointer-events-none' : ''}
            `}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex-shrink-0 select-none text-[rgba(238,234,244,0.35)]"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </span>
                <div className="min-w-0">
                  <h4 className="truncate font-medium text-[#eeeaf4]">{module.title}</h4>
                  <p className="mt-1 text-xs text-[rgba(238,234,244,0.45)]">
                    {module._count.quizzes} quiz
                    {(module._count.lessons ?? 0) > 0 &&
                      ` · ${module._count.lessons} lesson${module._count.lessons !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Link
                  href={`/admin/lessons/new?moduleId=${module.id}`}
                  className="text-sm font-medium text-[#2be4c8] hover:text-[#5ef0d4]"
                  onClick={(e) => e.stopPropagation()}
                >
                  + Lesson
                </Link>
                <Link
                  href={`/admin/modules/${module.id}/edit`}
                  className="text-sm font-medium text-[#f5c14a] hover:text-[#f9d06a]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
