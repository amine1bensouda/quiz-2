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
  locked?: boolean;
}

export default function CourseCard({
  id,
  title,
  description,
  moduleCount,
  totalQuizzes,
  slug,
  locked = false,
}: CourseCardProps) {
  const href = locked ? `/subscribe?courseId=${id}` : `/quiz/course/${slug}`;

  return (
    <Link
      href={href}
      className={`course-card group block w-full rounded-2xl border p-6 text-left shadow-lg transition-all duration-300 ${
        locked
          ? 'border-white/10 bg-[#111121]/55 opacity-90 hover:border-[#f5c14a]/30 hover:shadow-xl hover:shadow-black/30'
          : 'border-white/10 bg-[#111121]/85 shadow-black/20 hover:-translate-y-1 hover:border-[#f5c14a]/45 hover:shadow-2xl hover:shadow-black/40'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="course-card-title text-xl font-bold text-[#f5f2ff]">{title}</h3>
        {locked ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9d98ab]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
          </span>
        ) : (
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
        )}
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
