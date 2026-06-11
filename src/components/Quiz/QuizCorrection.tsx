'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Quiz } from '@/lib/types';
import { questionStemNeedsHtmlRenderer } from '@/lib/utils';
import MathRenderer from './MathRenderer';
import HtmlWithMathRenderer from '@/components/Common/HtmlWithMathRenderer';
import QuizCorrectionSidebar from './QuizCorrectionSidebar';

function answerImageUrl(answer: unknown): string | undefined {
  const a = answer as {
    imageUrl?: string;
    image_url?: string;
    acf?: { image?: string; image_url?: string };
  };
  return a.imageUrl || a.image_url || a.acf?.image || a.acf?.image_url;
}

interface QuizCorrectionProps {
  quiz: Quiz;
}

export default function QuizCorrection({ quiz }: QuizCorrectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions = quiz.acf?.questions || [];

  if (questions.length === 0) {
    return (
      <div className="correction-card rounded-2xl border border-white/10 bg-[#111121]/90 p-8 text-center shadow-xl shadow-black/30">
        <p className="text-lg text-[#a29cb0]">No questions available for this quiz.</p>
        <Link
          href={`/quiz/${quiz.slug}`}
          className="mt-4 inline-block rounded-xl bg-[#f5c14a] px-6 py-3 font-semibold text-[#080810] transition-colors hover:bg-[#e5b443]"
        >
          Back to Quiz
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answers = currentQuestion.reponses || currentQuestion.acf?.reponses || [];
  const correctAnswer = answers.find(
    (a: any) =>
      a.correcte === true ||
      a.correcte === 1 ||
      a.correcte === 'yes' ||
      a.is_correct === true ||
      a.is_correct === 1 ||
      a.is_correct === 'yes' ||
      a.correct === true
  );
  let questionText = currentQuestion.texte_question || currentQuestion.title?.rendered || '';
  const qAny = currentQuestion as Record<string, unknown>;
  if (
    !questionText ||
    (typeof questionText === 'string' && questionText.match(/^(a:\d+:\{|s:\d+:|O:\d+:|i:\d+|b:[01]|d:|N;)/))
  ) {
    questionText =
      (qAny.question_title as string) ||
      (qAny.question_name as string) ||
      (qAny.question_text as string) ||
      (qAny.question as string) ||
      currentQuestion.content?.rendered ||
      (qAny.post_title as string) ||
      (qAny.name as string) ||
      '';
  }
  if (!questionText || (typeof questionText === 'string' && questionText.trim() === '')) {
    questionText = `Question ${currentQuestionIndex + 1}`;
  }

  const needsHtmlStemRenderer = questionStemNeedsHtmlRenderer(questionText);

  let cleanedQuestionText = questionText;
  if (questionText && typeof questionText === 'string' && !needsHtmlStemRenderer) {
    cleanedQuestionText = questionText
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const mediaUrl =
    (currentQuestion.media as string | undefined) ||
    currentQuestion.acf?.media_url ||
    (typeof qAny.media === 'string' ? qAny.media : undefined);
  const questionContent = currentQuestion.content?.rendered || '';
  const explication = currentQuestion.explication || currentQuestion.acf?.explication || '';
  const questionType = currentQuestion.type_question || currentQuestion.acf?.type_question || 'QCM';
  const isTextInput =
    questionType === 'TexteLibre' || questionType === 'text_input' || questionType === 'open_ended';

  const navBtnBase =
    'flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-200';
  const navBtnEnabled =
    'border-2 border-white/15 bg-[#141424] text-[#eeeaf4] shadow-md hover:border-[#f5c14a]/40 hover:bg-[#18182e] transform hover:scale-105 active:scale-95';
  const navBtnDisabled = 'cursor-not-allowed bg-white/5 text-[#9d98ab] opacity-50';

  return (
    <div className="flex flex-col items-start gap-0 lg:flex-row">
      <QuizCorrectionSidebar
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        onQuestionSelect={setCurrentQuestionIndex}
      />

      <div className="w-full flex-1 lg:ml-0">
        <div className="correction-card rounded-2xl border border-white/10 bg-[#111121]/90 p-8 shadow-xl shadow-black/30 md:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#b388ff] shadow-lg shadow-[#b388ff]/20">
                <span className="text-lg font-bold text-white">{currentQuestionIndex + 1}</span>
              </div>
              <div>
                <span className="block text-base font-semibold text-[#f5f2ff]">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-[#9d98ab]">of {questions.length}</span>
              </div>
            </div>
            {currentQuestion.points && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                <span className="text-sm font-bold text-[#eeeaf4]">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {mediaUrl && (
            <div className="relative mb-6 h-72 w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg">
              <Image
                src={mediaUrl}
                alt=""
                fill
                className="bg-[#0c0c18] object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          <div className="mb-8">
            {needsHtmlStemRenderer ? (
              <div className="text-2xl font-bold leading-relaxed text-[#f5f2ff] md:text-3xl">
                <HtmlWithMathRenderer
                  html={questionText || ''}
                  className="prose prose-lg prose-invert max-w-none"
                />
              </div>
            ) : (
              <h2 className="text-2xl font-bold leading-relaxed text-[#f5f2ff] md:text-3xl">
                <MathRenderer text={cleanedQuestionText || ''} />
              </h2>
            )}
          </div>

          {questionContent && (
            <div className="prose prose-sm prose-invert mb-8 max-w-none leading-relaxed text-[#d4d0dc]">
              <HtmlWithMathRenderer html={questionContent} />
            </div>
          )}

          {correctAnswer ? (
            <div className="mb-6">
              <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-6">
                <div className="mb-4 flex items-start gap-3">
                  <svg className="mt-1 h-6 w-6 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-emerald-300">Correct Answer:</h3>
                    {answerImageUrl(correctAnswer) && (
                      <div className="mb-3 max-w-sm overflow-hidden rounded-xl border border-emerald-500/30 bg-[#0c0c18]">
                        <Image
                          src={answerImageUrl(correctAnswer)!}
                          alt=""
                          width={480}
                          height={320}
                          className="h-32 w-full object-contain sm:h-40"
                          sizes="(max-width: 640px) 100vw, 480px"
                        />
                      </div>
                    )}
                    <div className="text-lg font-medium text-emerald-200">
                      <HtmlWithMathRenderer html={correctAnswer.texte || ''} />
                    </div>
                    {correctAnswer.explication && (
                      <div className="mt-3 text-sm italic text-emerald-300/80">
                        <HtmlWithMathRenderer html={correctAnswer.explication} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : isTextInput ? (
            <div className="mb-6">
              <div className="rounded-xl border-2 border-[#b388ff]/40 bg-[#b388ff]/10 p-6">
                <p className="font-medium text-[#d4d0dc]">
                  {answers.length > 0 && answers[0]?.texte ? (
                    <>
                      <span className="font-bold text-[#f5f2ff]">Expected Answer:</span>{' '}
                      <HtmlWithMathRenderer html={answers[0].texte} />
                    </>
                  ) : (
                    'This is an open-ended question. Multiple answers may be acceptable.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-6">
                <p className="font-medium text-amber-200">⚠️ No correct answer marked for this question.</p>
              </div>
            </div>
          )}

          {!isTextInput && answers.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-[#f5f2ff]">All Answers:</h3>
              <div className="space-y-3">
                {answers.map((answer: any, index: number) => {
                  const isCorrect =
                    answer.correcte === true ||
                    answer.correcte === 1 ||
                    answer.correcte === 'yes' ||
                    answer.is_correct === true ||
                    answer.is_correct === 1 ||
                    answer.is_correct === 'yes' ||
                    answer.correct === true;

                  return (
                    <div
                      key={index}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        isCorrect
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-white/10 bg-[#141424]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/10 text-[#9d98ab]'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="min-w-0 flex-1">
                          {answerImageUrl(answer) && (
                            <div className="mb-3 max-h-40 w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-[#0c0c18]">
                              <Image
                                src={answerImageUrl(answer)!}
                                alt=""
                                width={480}
                                height={320}
                                className="h-32 w-full object-contain sm:h-40"
                                sizes="(max-width: 640px) 100vw, 480px"
                              />
                            </div>
                          )}
                          <div className={`font-medium ${isCorrect ? 'text-emerald-200' : 'text-[#eeeaf4]'}`}>
                            <HtmlWithMathRenderer html={answer.texte || ''} />
                          </div>
                          {answer.explication && (
                            <div className="mt-2 text-sm italic text-[#9d98ab]">
                              <HtmlWithMathRenderer html={answer.explication} />
                            </div>
                          )}
                        </div>
                        {isCorrect && (
                          <svg className="h-5 w-5 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {explication && (
            <div className="mt-6 rounded-xl border-l-4 border-[#f5c14a] bg-[#141424] p-6">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-[#f5f2ff]">
                <span className="text-lg">💡</span>
                Detailed Explanation:
              </p>
              <div className="text-sm leading-relaxed text-[#d4d0dc]">
                <HtmlWithMathRenderer html={explication} />
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className={`${navBtnBase} ${currentQuestionIndex === 0 ? navBtnDisabled : navBtnEnabled}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-2 text-sm text-[#9d98ab]">
              <span>{currentQuestionIndex + 1}</span>
              <span>/</span>
              <span>{questions.length}</span>
            </div>

            <button
              onClick={() =>
                setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
              }
              disabled={currentQuestionIndex === questions.length - 1}
              className={`${navBtnBase} ${
                currentQuestionIndex === questions.length - 1 ? navBtnDisabled : navBtnEnabled
              }`}
            >
              Next
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <Link
              href={`/quiz/${quiz.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f5c14a] px-6 py-3 font-semibold text-[#080810] transition-colors hover:bg-[#e5b443]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
