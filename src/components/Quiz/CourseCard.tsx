'use client';

import Link from 'next/link';
import { excerptFromHtml } from '@/lib/utils';

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
      className="course-card group block w-full rounded-2xl border border-white/10 bg-[#111121]/85 p-6 text-left shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#f5c14a]/45 hover:shadow-2xl hover:shadow-black/40"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="course-card-title text-xl font-bold text-[#f5f2ff]">{title}</h3>
        <svg
          className="h-6 w-6 text-[#f5c14a] opacity-0 transition-opacity group-hover:opacity-100"
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
        <p className="course-card-desc mb-5 min-w-0 line-clamp-3 text-sm leading-relaxed text-[#a29cb0]">
          {excerptFromHtml(description, 220)}
        </p>
      )}
      
      <div className="course-card-meta mt-auto flex items-center gap-3 text-xs font-medium text-[#d7d1e4]">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <svg className="h-4 w-4 text-[#b388ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {moduleCount} module{moduleCount !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <svg className="h-4 w-4 text-[#2be4c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {totalQuizzes} exam{totalQuizzes !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}
