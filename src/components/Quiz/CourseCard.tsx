'use client';

import Link from 'next/link';
import SafeHtmlRenderer from '@/components/Common/SafeHtmlRenderer';

interface CourseCardProps {
  id: string;
  title: string;
  description?: string | null;
  moduleCount: number;
  totalQuizzes: number;
  slug: string;
}

export default function CourseCard({
  title,
  description,
  moduleCount,
  totalQuizzes,
  slug,
}: CourseCardProps) {
  return (
    <Link
      href={`/quiz/course/${slug}`}
      className="group w-full text-left p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-300 block"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <svg
          className="w-6 h-6 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
      
      {description && (
        <div className="text-gray-600 mb-4 overflow-hidden">
          <SafeHtmlRenderer 
            html={description}
            className="prose prose-sm max-w-none course-card-description"
          />
        </div>
      )}
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {moduleCount} module{moduleCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {totalQuizzes} quiz
        </span>
      </div>
    </Link>
  );
}
