'use client';

import { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  quizCount?: number;
  icon?: React.ReactNode;
}

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  quizCount,
  icon,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/40 overflow-hidden transition-all duration-300 hover:shadow-3xl">
      {/* En-tête de l'accordéon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          {icon && <div className="text-2xl">{icon}</div>}
          <h2 className="text-lg md:text-xl font-bold text-gray-900 text-left">
            {title}
          </h2>
          {quizCount !== undefined && (
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
              {quizCount} quiz{quizCount > 1 ? 'zes' : ''}
            </span>
          )}
        </div>
        
        {/* Icône de flèche */}
        <div className="flex-shrink-0">
          <svg
            className={`w-6 h-6 text-gray-700 transition-transform duration-300 ${
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

      {/* Contenu de l'accordéon */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
