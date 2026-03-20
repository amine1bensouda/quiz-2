'use client';

interface AnswerButtonProps {
  answer: string;
  index: number;
  isSelected: boolean;
  isCorrect?: boolean;
  showResult?: boolean;
  onClick: () => void;
}

export default function AnswerButton({
  answer,
  index,
  isSelected,
  isCorrect,
  showResult = false,
  onClick,
}: AnswerButtonProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const letter = letters[index] || String(index + 1);

  return (
    <button
      onClick={onClick}
      disabled={showResult}
      className={`
        w-full text-left p-4 rounded-lg border-2 transition-all duration-200
        ${!showResult && 'hover:border-primary-400 hover:bg-primary-50 cursor-pointer'}
        ${isSelected && !showResult && 'border-primary-600 bg-primary-100'}
        ${showResult && isCorrect && 'border-green-500 bg-green-50'}
        ${showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50'}
        ${!isSelected && !showResult && 'border-gray-200 bg-white'}
        ${showResult && 'cursor-not-allowed'}
      `}
    >
      <div className="flex items-center gap-3">
        <span
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
            ${isSelected && !showResult && 'bg-primary-600 text-white'}
            ${showResult && isCorrect && 'bg-green-500 text-white'}
            ${showResult && isSelected && !isCorrect && 'bg-red-500 text-white'}
            ${!isSelected && !showResult && 'bg-gray-200 text-gray-700'}
          `}
        >
          {letter}
        </span>
        <span className="flex-1 font-medium text-gray-900">{answer}</span>
        {showResult && isCorrect && (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
}

