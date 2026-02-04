'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Category } from '@/lib/types';

export default function Navigation() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Utiliser l'API route pour les composants client
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(err => {
        console.error('Erreur chargement catégories:', err);
        setCategories([]);
      });
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <nav className="bg-gray-100 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto">
          <Link
            href="/quiz"
            className={`
              py-4 px-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
              ${isActive('/quiz') ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-700 hover:text-primary-600'}
            `}
          >
            All Quizzes
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categorie/${category.slug}`}
              className={`
                py-4 px-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors
                ${isActive(`/categorie/${category.slug}`) ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-700 hover:text-primary-600'}
              `}
            >
              {category.name} ({category.count})
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

