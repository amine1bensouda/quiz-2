'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import RichTextEditor from './RichTextEditor';

interface Answer {
  id?: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  imageUrl?: string;
  order: number;
}

interface Question {
  id?: string;
  text: string;
  type: string;
  points: number;
  explanation: string;
  timeLimit?: number;
  order: number;
  answers: Answer[];
}

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

export default function QuestionEditor({ question, index, onUpdate, onDelete }: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState<Question>(question);
  const questionIdRef = useRef<string | undefined>(question.id);

  // Synchroniser localQuestion avec la prop question seulement si c'est une nouvelle question (ID différent)
  // Ne pas synchroniser si c'est juste une mise à jour de la même question
  useEffect(() => {
    // Si l'ID change, c'est une nouvelle question, donc on synchronise
    if (question.id !== questionIdRef.current) {
      setLocalQuestion(question);
      questionIdRef.current = question.id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]); // Seulement dépendre de l'ID, pas de toute la question pour éviter les boucles infinies

  const updateQuestion = useCallback((updates: Partial<Question>) => {
    setLocalQuestion((prev) => {
      const updated = { ...prev, ...updates };
      // Appeler onUpdate de manière asynchrone pour éviter les boucles infinies
      // Utiliser queueMicrotask pour garantir que l'état local est mis à jour d'abord
      queueMicrotask(() => {
        onUpdate(updated);
      });
      return updated;
    });
  }, [onUpdate]);

  const handleAnswerChange = (answerIndex: number, updates: Partial<Answer>) => {
    const newAnswers = [...localQuestion.answers];
    newAnswers[answerIndex] = { ...newAnswers[answerIndex], ...updates };
    updateQuestion({ answers: newAnswers });
  };

  const handleAddAnswer = () => {
    const newAnswer: Answer = {
      text: '',
      isCorrect: false,
      explanation: '',
      imageUrl: '',
      order: localQuestion.answers.length,
    };
    updateQuestion({ answers: [...localQuestion.answers, newAnswer] });
  };

  const handleDeleteAnswer = (answerIndex: number) => {
    const newAnswers = localQuestion.answers.filter((_, i) => i !== answerIndex);
    updateQuestion({ answers: newAnswers.map((a, i) => ({ ...a, order: i })) });
  };

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Question {index + 1}</h3>
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Delete
        </button>
      </div>

      <div className="space-y-4">
        {/* Type and points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={localQuestion.type}
              onChange={(e) => updateQuestion({ type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="text_input">Text Input (Open-ended)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              min="1"
              value={localQuestion.points}
              onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              min="1"
              value={localQuestion.timeLimit || ''}
              onChange={(e) => updateQuestion({ timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Unlimited"
            />
          </div>
        </div>

        {/* Question text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <RichTextEditor
            value={localQuestion.text}
            onChange={(value) => updateQuestion({ text: value })}
            placeholder="Enter the question..."
          />
        </div>

        {/* Answers - Hidden for text input type */}
        {localQuestion.type !== 'text_input' ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Answers *
              </label>
              <button
                type="button"
                onClick={handleAddAnswer}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ➕ Add Answer
              </button>
            </div>
            <div className="space-y-3">
              {localQuestion.answers.map((answer, answerIndex) => (
                <div key={answerIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={answer.isCorrect}
                      onChange={(e) => handleAnswerChange(answerIndex, { isCorrect: e.target.checked })}
                      className="mt-2 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Answer text *</label>
                      <RichTextEditor
                        value={answer.text}
                        onChange={(value) => handleAnswerChange(answerIndex, { text: value })}
                        placeholder="Answer text..."
                        compact
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
                        <RichTextEditor
                          value={answer.explanation}
                          onChange={(value) => handleAnswerChange(answerIndex, { explanation: value })}
                          placeholder="Explanation (optional)..."
                          compact
                        />
                      </div>
                    </div>
                    {localQuestion.answers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAnswer(answerIndex)}
                        className="px-2 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Answer (for grading reference) *
            </label>
            <div className="space-y-3">
              {localQuestion.answers.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const newAnswer: Answer = {
                      text: '',
                      isCorrect: true,
                      explanation: '',
                      imageUrl: '',
                      order: 0,
                    };
                    updateQuestion({ answers: [newAnswer] });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  ➕ Add Expected Answer
                </button>
              ) : (
                localQuestion.answers.map((answer, answerIndex) => (
                  <div key={answerIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Expected answer (for reference) *</label>
                        <RichTextEditor
                          value={answer.text}
                          onChange={(value) => handleAnswerChange(answerIndex, { text: value })}
                          placeholder="Expected answer (for reference)..."
                          compact
                        />
                        <label className="block text-sm font-medium text-gray-700">Additional explanation (optional)</label>
                        <RichTextEditor
                          value={answer.explanation}
                          onChange={(value) => handleAnswerChange(answerIndex, { explanation: value })}
                          placeholder="Additional explanation (optional)..."
                          compact
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Note: For text input questions, answers will be compared case-insensitively (HTML stripped). Multiple acceptable answers can be added.
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* General explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            General Explanation (optional)
          </label>
          <RichTextEditor
            value={localQuestion.explanation}
            onChange={(value) => updateQuestion({ explanation: value })}
            placeholder="Enter general explanation of the question..."
          />
        </div>
      </div>
    </div>
  );
}
