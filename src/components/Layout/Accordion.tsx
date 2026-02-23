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
    <div className="backdrop-blur-xl bg-white/80 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 overflow-hidden transition-all duration-300 md:hover:shadow-3xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 sm:px-5 sm:py-4 md:px-6 md:py-5 border-b border-gray-200 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 transition-all duration-300 group text-left min-h-[52px] sm:min-h-0"
      >
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          {icon && <div className="flex-shrink-0 text-lg sm:text-xl md:text-2xl">{icon}</div>}
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 break-words min-w-0">
            {title}
          </h2>
          {countLabel && (
            <span className="flex-shrink-0 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold">
              {countLabel}
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          <svg
            className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-700 transition-transform duration-300 ${
              isOpen ? 'transform rotate-180' : ''
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
