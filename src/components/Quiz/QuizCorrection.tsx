'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Quiz, Question } from '@/lib/types';
import MathRenderer from './MathRenderer';
import QuizCorrectionSidebar from './QuizCorrectionSidebar';

interface QuizCorrectionProps {
  quiz: Quiz;
}

export default function QuizCorrection({ quiz }: QuizCorrectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions = quiz.acf?.questions || [];

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
        <p className="text-gray-600 text-lg">No questions available for this quiz.</p>
        <Link
          href={`/quiz/${quiz.slug}`}
          className="mt-4 inline-block px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors"
        >
          Back to Quiz
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answers = currentQuestion.reponses || currentQuestion.acf?.reponses || [];
  const correctAnswer = answers.find((a: any) => 
    a.correcte === true || 
    a.correcte === 1 || 
    a.correcte === 'yes' ||
    a.is_correct === true ||
    a.is_correct === 1 ||
    a.is_correct === 'yes' ||
    a.correct === true
  );
  const questionText = currentQuestion.texte_question || currentQuestion.title?.rendered || '';
  const explication = currentQuestion.explication || currentQuestion.acf?.explication || '';
  const questionType = currentQuestion.type_question || currentQuestion.acf?.type_question || 'QCM';
  const isTextInput = questionType === 'TexteLibre' || questionType === 'text_input' || questionType === 'open_ended';

  return (
    <div className="flex flex-col lg:flex-row gap-0 items-start">
      {/* Sidebar */}
      <QuizCorrectionSidebar
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        onQuestionSelect={setCurrentQuestionIndex}
      />

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-0">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-200">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{currentQuestionIndex + 1}</span>
              </div>
              <div>
                <span className="text-base font-semibold text-gray-900 block">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-gray-500">
                  of {questions.length}
                </span>
              </div>
            </div>
            {currentQuestion.points && (
              <div className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-300">
                <span className="text-sm font-bold text-gray-900">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
              <MathRenderer text={questionText || ''} />
            </h2>
          </div>

          {/* Correct Answer */}
          {correctAnswer ? (
            <div className="mb-6">
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-900 mb-2">Correct Answer:</h3>
                    <p className="text-green-800 font-medium text-lg">
                      <MathRenderer text={correctAnswer.texte || ''} />
                    </p>
                    {correctAnswer.explication && (
                      <p className="text-sm text-green-700 mt-3 italic">
                        <MathRenderer text={correctAnswer.explication} />
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : isTextInput ? (
            <div className="mb-6">
              <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                <p className="text-blue-900 font-medium">
                  {answers.length > 0 && answers[0]?.texte ? (
                    <>
                      <span className="font-bold">Expected Answer:</span>{' '}
                      <MathRenderer text={answers[0].texte} />
                    </>
                  ) : (
                    'This is an open-ended question. Multiple answers may be acceptable.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-6">
                <p className="text-yellow-900 font-medium">
                  ⚠️ No correct answer marked for this question.
                </p>
              </div>
            </div>
          )}

          {/* All Answers (for multiple choice) */}
          {!isTextInput && answers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Answers:</h3>
              <div className="space-y-3">
                {answers.map((answer: any, index: number) => {
                  const isCorrect = answer.correcte === true || 
                    answer.correcte === 1 || 
                    answer.correcte === 'yes' ||
                    answer.is_correct === true ||
                    answer.is_correct === 1 ||
                    answer.is_correct === 'yes' ||
                    answer.correct === true;

                  return (
                    <div
                      key={index}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${isCorrect 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                          ${isCorrect 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                          }
                        `}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCorrect ? 'text-green-900' : 'text-gray-900'}`}>
                            <MathRenderer text={answer.texte || ''} />
                          </p>
                          {answer.explication && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              <MathRenderer text={answer.explication} />
                            </p>
                          )}
                        </div>
                        {isCorrect && (
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* General Explanation */}
          {explication && (
            <div className="mt-6 p-6 rounded-xl bg-gray-50 border-l-4 border-gray-900">
              <p className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Detailed Explanation:
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                <MathRenderer text={explication} />
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{currentQuestionIndex + 1}</span>
              <span>/</span>
              <span>{questions.length}</span>
            </div>

            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                ${
                  currentQuestionIndex === questions.length - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                }
              `}
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Back to Quiz Link */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href={`/quiz/${quiz.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
