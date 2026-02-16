'use client';

import { useState } from 'react';
import type { Question } from '@/lib/types';
import MathRenderer from './MathRenderer';

interface QuizSidebarProps {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswers: Record<number, string>;
  onQuestionSelect: (index: number) => void;
  isOpen: boolean;
  flaggedQuestions: Set<number>;
  onToggleFlag: (index: number) => void;
}

export default function QuizSidebar({
  questions,
  currentQuestionIndex,
  selectedAnswers,
  onQuestionSelect,
  isOpen,
  flaggedQuestions,
  onToggleFlag,
}: QuizSidebarProps) {
  const getQuestionStatus = (index: number) => {
    const hasAnswer = selectedAnswers[index] !== undefined;
    const isCurrent = index === currentQuestionIndex;
    
    if (isCurrent) {
      return 'current';
    }
    if (hasAnswer) {
      return 'answered';
    }
    return 'unanswered';
  };

  const getQuestionText = (question: Question, index: number): string => {
    const text = question.texte_question || question.title?.rendered || '';
    if (!text || text.trim() === '') {
      return `Question ${index + 1}`;
    }
    // Retourner le texte complet pour que MathRenderer le traite
    // La troncature visuelle sera gérée par CSS (WebkitLineClamp)
    return text;
  };

  return (
    <aside className={`
      hidden lg:block sticky top-0 self-start w-80 bg-white shadow-2xl z-40 overflow-y-auto border-r border-gray-200 h-[calc(100vh-16rem)]
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="px-6 pb-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Questions du quiz
          </h2>
        </div>
          
          {/* Statistiques */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">
                {Object.keys(selectedAnswers).length} répondues
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-gray-600">
                {questions.length - Object.keys(selectedAnswers).length} sans réponse
              </span>
            </div>
            {flaggedQuestions.size > 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-yellow-600 fill-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="text-yellow-600 font-medium">
                  {flaggedQuestions.size} marquées
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Liste des questions */}
        <div className="px-4 pt-0 pb-4 space-y-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(index);
            const questionText = getQuestionText(question, index);

            const isFlagged = flaggedQuestions.has(index);

            return (
              <div
                key={index}
                className={`
                  w-full rounded-xl border-2 transition-all duration-200
                  ${
                    status === 'current'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : status === 'answered'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }
                  ${isFlagged ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                `}
              >
                <button
                  onClick={() => {
                    onQuestionSelect(index);
                  }}
                  className={`
                    w-full text-left p-4 rounded-xl transition-all duration-200
                    ${
                      status === 'current'
                        ? 'hover:bg-blue-100'
                        : status === 'answered'
                        ? 'hover:bg-green-100'
                        : 'hover:bg-gray-50'
                    }
                    transform hover:scale-[1.01] active:scale-[0.99]
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Numéro de la question */}
                    <div
                      className={`
                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                        ${
                          status === 'current'
                            ? 'bg-blue-600 text-white'
                            : status === 'answered'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }
                      `}
                    >
                      {index + 1}
                    </div>

                    {/* Texte de la question */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`
                          text-sm font-medium leading-relaxed
                          ${
                            status === 'current'
                              ? 'text-blue-900'
                              : status === 'answered'
                              ? 'text-green-900'
                              : 'text-gray-700'
                          }
                        `}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        <MathRenderer text={questionText} className="text-sm" />
                      </div>
                    </div>

                    {/* Indicateur de statut */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {status === 'answered' && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {status === 'current' && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </button>
                
                {/* Bouton drapeau */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFlag(index);
                  }}
                  className={`
                    w-full px-4 pb-3 flex items-center justify-center transition-colors
                    ${isFlagged 
                      ? 'text-yellow-700 hover:text-yellow-800' 
                      : 'text-gray-500 hover:text-yellow-600'
                    }
                  `}
                  title={isFlagged ? 'Remove flag' : 'Flag this question'}
                >
                  <svg 
                    className={`w-5 h-5 ${isFlagged ? 'fill-current' : ''}`} 
                    fill={isFlagged ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Note en bas */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            💡 Click on a question to access it directly
          </p>
        </div>
      </aside>
  );
}
