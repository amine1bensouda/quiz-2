import { getAllCategories } from '@/lib/wordpress';
import Link from 'next/link';
import type { Category } from '@/lib/types';

interface SidebarProps {
  categories?: Category[];
}

export default function Sidebar({ categories = [] }: SidebarProps) {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="space-y-6">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categorie/${category.slug}`}
                    className="flex items-center justify-between text-gray-700 hover:text-primary-600 transition-colors py-2"
                  >
                    <span>{category.name}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {category.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

