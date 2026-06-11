'use client';

import type { Question } from '@/lib/types';
import { questionStemNeedsHtmlRenderer } from '@/lib/utils';
import MathRenderer from './MathRenderer';
import HtmlWithMathRenderer from '@/components/Common/HtmlWithMathRenderer';

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
    return text;
  };

  return (
    <aside className="correction-sidebar sticky top-24 hidden h-[calc(100vh-12rem)] w-80 flex-col self-start border-r border-white/10 bg-[#111121]/95 shadow-2xl shadow-black/30 lg:flex">
      <div className="flex-shrink-0 border-b border-white/10 bg-[#111121] px-6 py-4">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-[#f5f2ff]">Quiz Questions</h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#9d98ab]">
          <div className="h-2 w-2 rounded-full bg-[#b388ff]" />
          <span>{questions.length} questions</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4 pt-3">
        {questions.map((question, index) => {
          const isCurrent = index === currentQuestionIndex;
          const questionText = getQuestionText(question, index);
          const answers = question.reponses || question.acf?.reponses || [];
          const hasCorrectAnswer = answers.some(
            (a: any) =>
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
              className={`w-full rounded-lg border-2 transition-all duration-200 ${
                isCurrent
                  ? 'border-[#b388ff]/50 bg-[#b388ff]/10 shadow-sm'
                  : 'border-white/10 bg-[#141424] hover:border-white/20 hover:shadow-sm'
              }`}
            >
              <button
                onClick={() => onQuestionSelect(index)}
                className={`relative w-full rounded-lg p-3 text-left transition-all duration-200 ${
                  isCurrent ? 'hover:bg-[#b388ff]/15' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                      isCurrent ? 'bg-[#b388ff] text-white' : 'bg-white/10 text-[#9d98ab]'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div
                      className={`text-xs font-medium leading-snug ${
                        isCurrent ? 'text-[#f5f2ff]' : 'text-[#d4d0dc]'
                      }`}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {questionStemNeedsHtmlRenderer(questionText) ? (
                        <HtmlWithMathRenderer html={questionText} className="text-xs" />
                      ) : (
                        <MathRenderer text={questionText} className="text-xs" />
                      )}
                    </div>
                    {!hasCorrectAnswer && (
                      <div className="mt-1 text-xs text-amber-400">⚠️ No answer</div>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-[#b388ff]" />}
                    {hasCorrectAnswer && (
                      <svg className="h-4 w-4 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 bg-[#0e0e1a] px-3 py-3">
        <p className="text-center text-xs text-[#9d98ab]">💡 Click to view correction</p>
      </div>
    </aside>
  );
}
