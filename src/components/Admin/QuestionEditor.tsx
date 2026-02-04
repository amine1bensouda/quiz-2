'use client';

import { useState } from 'react';

interface Answer {
  id?: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
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

  const updateQuestion = (updates: Partial<Question>) => {
    const updated = { ...localQuestion, ...updates };
    setLocalQuestion(updated);
    onUpdate(updated);
  };

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
          Supprimer
        </button>
      </div>

      <div className="space-y-4">
        {/* Type et points */}
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
              <option value="multiple_choice">Choix multiple</option>
              <option value="true_false">Vrai/Faux</option>
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
              Temps limite (secondes)
            </label>
            <input
              type="number"
              min="1"
              value={localQuestion.timeLimit || ''}
              onChange={(e) => updateQuestion({ timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Illimité"
            />
          </div>
        </div>

        {/* Texte de la question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte de la question *
          </label>
          <textarea
            required
            value={localQuestion.text}
            onChange={(e) => updateQuestion({ text: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Entrez la question..."
          />
        </div>

        {/* Réponses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Réponses *
            </label>
            <button
              type="button"
              onClick={handleAddAnswer}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ➕ Ajouter une réponse
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
                    <input
                      type="text"
                      required
                      value={answer.text}
                      onChange={(e) => handleAnswerChange(answerIndex, { text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Texte de la réponse..."
                    />
                    <input
                      type="text"
                      value={answer.explanation}
                      onChange={(e) => handleAnswerChange(answerIndex, { explanation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      placeholder="Explication (optionnel)..."
                    />
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

        {/* Explication générale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explication générale (optionnel)
          </label>
          <textarea
            value={localQuestion.explanation}
            onChange={(e) => updateQuestion({ explanation: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Explication générale de la question..."
          />
        </div>
      </div>
    </div>
  );
}
