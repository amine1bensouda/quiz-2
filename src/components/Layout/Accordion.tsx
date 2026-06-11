'use client';

import { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  quizCount?: number;
  lessonCount?: number;
  icon?: React.ReactNode;
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  quizCount,
  lessonCount,
  icon,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasQuizzes = (quizCount ?? 0) > 0;
  const hasLessons = (lessonCount ?? 0) > 0;
  const countLabel = [hasQuizzes && `${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}`, hasLessons && `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`].filter(Boolean).join(' · ');

  return (
    <div className="course-accordion overflow-hidden rounded-2xl border border-white/10 bg-[#111121]/85 shadow-lg shadow-black/20 transition-all duration-300 sm:rounded-3xl md:hover:shadow-2xl md:hover:shadow-black/40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="course-accordion-trigger group flex min-h-[52px] w-full items-center justify-between gap-3 border-b border-white/10 bg-[#141424] px-4 py-4 text-left transition-all duration-300 hover:bg-[#18182e] sm:min-h-0 sm:px-5 sm:py-4 md:px-6 md:py-5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
          {icon && <div className="flex-shrink-0 text-lg sm:text-xl md:text-2xl">{icon}</div>}
          <h2 className="min-w-0 break-words text-base font-bold text-[#f5f2ff] sm:text-lg md:text-xl">
            {title}
          </h2>
          {countLabel && (
            <span className="flex-shrink-0 rounded-full border border-[#b388ff]/30 bg-[#b388ff]/10 px-2 py-0.5 text-xs font-semibold text-[#b388ff] sm:px-3 sm:py-1 sm:text-sm">
              {countLabel}
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          <svg
            className={`h-5 w-5 text-[#9d98ab] transition-transform duration-300 sm:h-6 sm:w-6 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 sm:p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}
