'use client';

import type { Question } from '@/lib/types';
import MathRenderer from './MathRenderer';

interface QuizCorrectionSidebarProps {
  questions: Question[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}

export default function QuizCorrectionSidebar({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
}: QuizCorrectionSidebarProps) {
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
    <aside className="hidden lg:flex flex-col sticky top-24 self-start w-80 bg-white shadow-2xl z-40 border-r border-gray-200 h-[calc(100vh-12rem)]">
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Quiz Questions
          </h2>
        </div>
        
        {/* Statistiques */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span>
            {questions.length} questions
          </span>
        </div>
      </div>

      {/* Liste des questions */}
      <div className="px-3 pt-3 pb-4 space-y-2 overflow-y-auto flex-1 min-h-0">
        {questions.map((question, index) => {
          const isCurrent = index === currentQuestionIndex;
          const questionText = getQuestionText(question, index);
          const answers = question.reponses || question.acf?.reponses || [];
          const hasCorrectAnswer = answers.some((a: any) => 
            a.correcte === true || 
            a.correcte === 1 || 
            a.correcte === 'yes' ||
            a.is_correct === true ||
            a.is_correct === 1 ||
            a.is_correct === 'yes' ||
            a.correct === true
          );

          return (
            <div
              key={index}
              className={`
                w-full rounded-lg border-2 transition-all duration-200
                ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <button
                onClick={() => onQuestionSelect(index)}
                className={`
                  w-full text-left p-3 rounded-lg transition-all duration-200 relative
                  ${
                    isCurrent
                      ? 'hover:bg-indigo-100'
                      : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Numéro de la question */}
                  <div
                    className={`
                      flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs
                      ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {index + 1}
                  </div>

                  {/* Texte de la question */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                      className={`
                        text-xs font-medium leading-snug
                        ${
                          isCurrent
                            ? 'text-indigo-900'
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
                      <MathRenderer text={questionText} className="text-xs" />
                    </div>
                    {!hasCorrectAnswer && (
                      <div className="text-xs text-yellow-600 mt-1">⚠️ No answer</div>
                    )}
                  </div>

                  {/* Indicateur de statut */}
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    )}
                    {hasCorrectAnswer && (
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Note en bas */}
      <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          💡 Click to view correction
        </p>
      </div>
    </aside>
  );
}
