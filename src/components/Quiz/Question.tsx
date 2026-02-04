'use client';

import Image from 'next/image';
import type { Question as QuestionType } from '@/lib/types';
import MathRenderer from './MathRenderer';

interface QuestionProps {
  question: QuestionType;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  showResult?: boolean;
  correctAnswer?: string;
}

export default function Question({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  showResult = false,
  correctAnswer,
}: QuestionProps) {
  // Vérification de sécurité
  if (!question) {
    return (
      <div className="card-modern p-8 text-center">
        <p className="text-gray-600">Question not found</p>
      </div>
    );
  }

  // Gérer les deux formats : Repeater ACF ou Question WordPress
  // Format Repeater ACF (dans quiz.acf.questions)
  let questionText = question.texte_question || question.title?.rendered || '';
  
  // Si le texte est vide ou sérialisé, chercher dans d'autres champs
  if (!questionText || (typeof questionText === 'string' && questionText.match(/^(a:\d+:\{|s:\d+:|O:\d+:|i:\d+|b:[01]|d:|N;)/))) {
    // Essayer d'autres champs possibles
    const questionAny = question as any;
    questionText = questionAny.question_title 
      || questionAny.question_name
      || questionAny.question_text
      || questionAny.question
      || question.content?.rendered
      || questionAny.post_title
      || questionAny.name
      || '';
  }
  
  // Vérifier si c'est toujours du code sérialisé PHP
  if (questionText && typeof questionText === 'string') {
    // Détecter le format PHP sérialisé
    if (questionText.match(/^(a:\d+:\{|s:\d+:|O:\d+:|i:\d+|b:[01]|d:|N;)/) || 
        (questionText.match(/[a-z]:\d+:/g) && questionText.match(/[a-z]:\d+:/g)!.length > 3)) {
      console.warn('⚠️ Texte de question contient du code sérialisé');
      // Utiliser l'ID de la question comme fallback
      const questionId = question.id || questionNumber;
      questionText = `Question ${questionId}`;
    }
  }
  
  // Si toujours vide, utiliser un message par défaut
  if (!questionText || questionText.trim() === '') {
    questionText = `Question ${questionNumber}`;
  }

  // Nettoyer et améliorer le formatage du texte
  // Remplacer les balises HTML par des sauts de ligne appropriés
  if (questionText && typeof questionText === 'string') {
    // Remplacer les balises de paragraphe et de saut de ligne par des espaces
    questionText = questionText
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n') // Limiter les sauts de ligne multiples
      .trim();
  }
  
  const questionContent = question.content?.rendered || '';
  const answers = question.reponses || question.acf?.reponses || [];
  const mediaUrl = question.media || question.acf?.media_url;
  const explication = question.explication || question.acf?.explication;
  const points = question.points || question.acf?.points;

  // Vérifier qu'il y a des réponses
  if (answers.length === 0) {
    return (
      <div className="card-modern p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{questionText}</h2>
        <p className="text-red-600">No answers available for this question.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-200 relative overflow-hidden">
      {/* Effet de fond décoratif */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gray-100 rounded-full blur-3xl opacity-30 -z-0"></div>
      
      <div className="relative z-10">
        {/* En-tête de la question */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{questionNumber}</span>
            </div>
            <div>
              <span className="text-base font-semibold text-gray-900 block">Question {questionNumber}</span>
              <span className="text-sm text-gray-500">of {totalQuestions}</span>
            </div>
          </div>
          {points && (
            <div className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-300">
              <span className="text-sm font-bold text-gray-900">
                {points} point{points !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Média (image) si présent */}
        {mediaUrl && (
          <div className="relative w-full h-72 mb-6 rounded-2xl overflow-hidden shadow-lg group">
            <Image
              src={mediaUrl}
              alt={questionText}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        )}

        {/* Texte de la question */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
            <MathRenderer text={questionText || ''} />
          </h2>
        </div>

        {/* Description si présente */}
        {questionContent && (
          <div
            className="prose prose-sm max-w-none mb-8 text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: questionContent }}
          />
        )}

        {/* Liste des réponses */}
        <div className="space-y-4">
          {answers.map((answer, index) => {
            const answerKey = `answer-${index}`;
            const isSelected = selectedAnswer === answerKey;
            const isCorrect = answer.correcte;
            const showCorrect = showResult && isCorrect;
            const showIncorrect = showResult && isSelected && !isCorrect;

  const getButtonStyles = () => {
    if (showCorrect) {
      return 'border-green-500 bg-green-50 shadow-green-100';
    }
    if (showIncorrect) {
      return 'border-red-500 bg-red-50 shadow-red-100';
    }
    if (isSelected && !showResult) {
      return 'border-gray-900 bg-gray-50 shadow-gray-100';
    }
    return 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50';
  };

            return (
              <button
                key={index}
                onClick={() => !showResult && onAnswerSelect(answerKey)}
                disabled={showResult}
                className={`
                  w-full text-left p-6 rounded-xl border-2 transition-all duration-300 transform
                  ${getButtonStyles()}
                  ${!showResult && 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md hover:shadow-lg'}
                  ${showResult && 'cursor-not-allowed'}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Indicateur de réponse */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300
                    ${showCorrect && 'bg-green-600 text-white shadow-lg'}
                    ${showIncorrect && 'bg-red-600 text-white shadow-lg'}
                    ${isSelected && !showResult && 'bg-gray-900 text-white shadow-lg'}
                    ${!isSelected && !showResult && 'bg-gray-100 text-gray-600 border-2 border-gray-300'}
                  `}>
                    {showResult && isCorrect && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {showIncorrect && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    {!showResult && isSelected && (
                      <div className="w-4 h-4 rounded-full bg-white"></div>
                    )}
                    {!showResult && !isSelected && (
                      <span>{String.fromCharCode(65 + index)}</span>
                    )}
                  </div>
                  
                  {/* Texte de la réponse */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg leading-relaxed">
                      <MathRenderer text={answer.texte || ''} />
                    </p>
                    {showResult && answer.explication && (
                      <p className="text-sm text-gray-600 mt-3 italic leading-relaxed bg-gray-50 p-3 rounded-lg">
                        💡 <MathRenderer text={answer.explication || ''} />
                      </p>
                    )}
                  </div>
                  
                  {/* Badge correcte */}
                  {showCorrect && (
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold">
                        ✓ Correct
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explication générale si présente et résultat affiché */}
        {showResult && explication && (
          <div className="mt-8 p-6 rounded-xl bg-gray-50 border-l-4 border-gray-900 shadow-md animate-fade-in">
            <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              Detailed Explanation:
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <MathRenderer text={explication || ''} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
