'use client';

import { useState, useEffect } from 'react';
import type { Quiz, Question } from '@/lib/types';
import type { QuizResults } from '@/lib/types';
import QuestionComponent from './Question';
import Results from './Results';
import { shuffleArray } from '@/lib/utils';
import { trackQuizStart, trackAnswerSelect, trackQuizComplete } from '@/lib/analytics';
import { saveQuizAttempt } from '@/lib/auth-client';

interface QuizPlayerProps {
  quiz: Quiz;
}

export default function QuizPlayer({ quiz }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [startTime] = useState(Date.now());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Initialiser les questions et charger la progression sauvegardée
  useEffect(() => {
    const quizQuestions = quiz.acf?.questions || [];
    
    console.log('🎮 QuizPlayer - Initialisation:', {
      quizId: quiz.id,
      quizTitle: quiz.title.rendered,
      questionsCount: quizQuestions.length,
      hasAcf: !!quiz.acf,
      hasQuestions: !!quiz.acf?.questions,
      questionsType: Array.isArray(quizQuestions) ? 'array' : typeof quizQuestions,
    });
    
    if (quizQuestions.length === 0) {
      console.warn('⚠️ No questions available in quiz.acf.questions');
    }
    
    // Mélanger les questions si l'ordre est aléatoire
    if (quiz.acf?.ordre_questions === 'Aleatoire') {
      setQuestions(shuffleArray(quizQuestions));
    } else {
      setQuestions(quizQuestions);
    }

    // Vérifier si on doit réinitialiser (paramètre URL ?reset=true)
    // Vérifier que window existe (côté client uniquement)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shouldReset = urlParams.get('reset') === 'true';
      
      if (shouldReset) {
        // Nettoyer la progression sauvegardée
        localStorage.removeItem(`quiz-progress-${quiz.id}`);
        // Réinitialiser l'état
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuizCompleted(false);
        setResults(null);
        setShowResults(false);
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // Charger la progression sauvegardée seulement si on ne reset pas
        const savedProgress = localStorage.getItem(`quiz-progress-${quiz.id}`);
        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress);
            setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
            setSelectedAnswers(progress.selectedAnswers || {});
          } catch (error) {
            console.error('Error loading progress:', error);
          }
        }
      }
    }

    // Track le début du quiz
    trackQuizStart(quiz.id, quiz.title.rendered.replace(/<[^>]*>/g, ''));
  }, [quiz]);

  // Calculer la question actuelle et les valeurs dérivées
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const selectedAnswer = currentQuestion
    ? selectedAnswers[currentQuestionIndex]
    : undefined;

  // Gérer le timer pour la question actuelle
  useEffect(() => {
    if (!currentQuestion) return;

    const tempsLimite = currentQuestion.temps_limite || currentQuestion.acf?.temps_limite;
    
    if (tempsLimite && tempsLimite > 0) {
      setTimeRemaining(tempsLimite);
      setQuestionStartTime(Date.now());
      
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [currentQuestion, currentQuestionIndex]);

  // Sauvegarder la progression dans localStorage
  useEffect(() => {
    if (questions.length > 0) {
      const progress = {
        currentQuestionIndex,
        selectedAnswers,
        timestamp: Date.now(),
      };
      localStorage.setItem(`quiz-progress-${quiz.id}`, JSON.stringify(progress));
    }
  }, [currentQuestionIndex, selectedAnswers, quiz.id, questions.length]);

  const handleAnswerSelect = (answerKey: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answerKey,
    });
    // Track la sélection de réponse
    trackAnswerSelect(quiz.id, currentQuestionIndex + 1);
  };

  const handleNext = async () => {
    // Nettoyer la progression sauvegardée
    localStorage.removeItem(`quiz-progress-${quiz.id}`);
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    } else {
      // Dernière question, calculer les résultats
      await calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const calculateResults = async () => {
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    const answerDetails: QuizResults['answers'] = [];

    console.log('📊 Calcul des résultats:', {
      totalQuestions: questions.length,
      selectedAnswers,
      questionsCount: questions.length,
    });

    questions.forEach((question, index) => {
      const selectedAnswerKey = selectedAnswers[index];
      // Gérer les deux formats : Repeater ACF ou Question WordPress
      const answers = question.reponses || question.acf?.reponses || [];
      
      console.log(`  Question ${index + 1}:`, {
        questionId: question.id,
        selectedAnswerKey,
        answersCount: answers.length,
        answers: answers.map((a: any, i: number) => ({
          index: i,
          texte: a.texte?.substring(0, 30),
          correcte: a.correcte,
        })),
      });
      
      const selectedAnswerIndex = selectedAnswerKey
        ? parseInt(selectedAnswerKey.split('-')[1])
        : -1;
      
      const selectedAnswer = selectedAnswerIndex >= 0 && selectedAnswerIndex < answers.length 
        ? answers[selectedAnswerIndex] 
        : null;
      
      // Trouver la bonne réponse - vérifier plusieurs formats
      const correctAnswer = answers.find((a: any) => 
        a.correcte === true || 
        a.correcte === 1 || 
        a.correcte === 'yes' ||
        a.is_correct === true ||
        a.is_correct === 1 ||
        a.is_correct === 'yes' ||
        a.correct === true
      );

      // Vérifier si la réponse sélectionnée est correcte
      let isCorrect = false;
      
      if (selectedAnswer) {
        // Vérifier le champ correcte (normalisé depuis Tutor LMS)
        const correcteValue = (selectedAnswer as any).correcte;
        if (correcteValue === true || correcteValue === 1 || correcteValue === 'yes') {
          isCorrect = true;
        }
        // Fallback vers d'autres champs possibles
        const answerAny = selectedAnswer as any;
        if (answerAny.is_correct === true || answerAny.is_correct === 1 || answerAny.is_correct === 'yes') {
          isCorrect = true;
        }
        else if (answerAny.correct === true || answerAny.correct === 1 || answerAny.correct === 'yes') {
          isCorrect = true;
        }
        
        // Si la réponse sélectionnée est la même que la bonne réponse trouvée (comparaison par texte)
        if (!isCorrect && correctAnswer) {
          const selectedText = (selectedAnswer.texte || '').trim();
          const correctText = (correctAnswer.texte || '').trim();
          if (selectedText && correctText && selectedText === correctText) {
            isCorrect = true;
          }
        }
        
        // Comparaison par index si la bonne réponse est trouvée
        if (!isCorrect && correctAnswer) {
          const correctAnswerIndex = answers.indexOf(correctAnswer);
          if (selectedAnswerIndex === correctAnswerIndex) {
            isCorrect = true;
          }
        }
      }

      console.log(`  Résultat Question ${index + 1}:`, {
        selectedAnswerIndex,
        selectedAnswer: selectedAnswer ? {
          texte: selectedAnswer.texte?.substring(0, 30),
          correcte: selectedAnswer.correcte,
          is_correct: (selectedAnswer as any).is_correct,
          correct: (selectedAnswer as any).correct,
        } : null,
        correctAnswer: correctAnswer ? {
          texte: correctAnswer.texte?.substring(0, 30),
          correcte: correctAnswer.correcte,
        } : null,
        isCorrect,
      });

      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      answerDetails.push({
        questionId: question.id || index,
        selectedAnswer: selectedAnswer?.texte || 'Aucune réponse',
        isCorrect,
        correctAnswer: correctAnswer?.texte || 'Inconnu',
      });
    });

    console.log('📊 Résultats finaux:', {
      correctAnswers,
      incorrectAnswers,
      totalQuestions: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
    });

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const minimumScore = quiz.acf?.score_minimum || 70;

    const quizResults: QuizResults = {
      score: correctAnswers,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      percentage,
      passed: percentage >= minimumScore,
      timeSpent,
      answers: answerDetails,
    };

    setResults(quizResults);
    setQuizCompleted(true);
    
    // Save quiz attempt for logged-in users
    try {
      // Récupérer l'ID string du quiz depuis Prisma via son slug
      let quizIdString: string;
      
      if (typeof quiz.id === 'number') {
        // Si c'est un number, on doit récupérer le quiz depuis Prisma
        try {
          const response = await fetch(`/api/quizzes/${quiz.slug}/id`);
          if (response.ok) {
            const data = await response.json();
            quizIdString = data.id;
          } else {
            // Fallback: ne pas sauvegarder si on ne peut pas trouver l'ID
            console.warn('Could not fetch quiz ID from API, skipping save');
            return;
          }
        } catch (error) {
          console.error('Error fetching quiz ID:', error);
          return; // Ne pas sauvegarder si erreur
        }
      } else {
        quizIdString = String(quiz.id);
      }

      await saveQuizAttempt({
        quizId: quizIdString,
        quizTitle: quiz.title.rendered.replace(/<[^>]*>/g, ''),
        quizSlug: quiz.slug,
        score: quizResults.score,
        percentage: quizResults.percentage,
        totalQuestions: quizResults.totalQuestions,
        correctAnswers: quizResults.correctAnswers,
        completedAt: new Date().toISOString(),
        timeSpent: quizResults.timeSpent,
      });
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
    
    // Track la fin du quiz
    trackQuizComplete(
      quiz.id,
      quiz.title.rendered.replace(/<[^>]*>/g, ''),
      quizResults.score,
      quizResults.percentage,
      quizResults.timeSpent
    );
  };

  if (quizCompleted && results) {
    return (
      <Results 
        results={results} 
        quizTitle={quiz.title.rendered} 
        quizSlug={quiz.slug} 
        minimumScore={quiz.acf?.score_minimum}
        quizId={quiz.id}
        category={quiz.acf?.categorie}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    );
  }

  // Trouver la bonne réponse pour l'affichage
  // Gérer les deux formats : Repeater ACF ou Question WordPress
  const answers = currentQuestion.reponses || currentQuestion.acf?.reponses || [];
  const correctAnswer = answers.find((a) => a.correcte);
  const correctAnswerKey = correctAnswer
    ? `answer-${answers.indexOf(correctAnswer)}`
    : undefined;

  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Barre de progression moderne */}
      <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold shadow-lg">
              {currentQuestionIndex + 1}
            </div>
            <div>
              <span className="text-base font-semibold text-gray-900 block">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-sm text-gray-500">
                {totalQuestions - (currentQuestionIndex + 1)} remaining
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Timer si disponible */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold ${
                timeRemaining <= 10 
                  ? 'border-red-500 bg-red-50 text-red-700 animate-pulse' 
                  : timeRemaining <= 30
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-900 bg-gray-50 text-gray-900'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold text-lg">{timeRemaining}s</span>
              </div>
            )}
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 block">
                {Math.round(progressPercentage)}%
              </span>
              <span className="text-xs text-gray-500">Progress</span>
            </div>
          </div>
        </div>
        
        {/* Barre de progression animée */}
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="progress-fill relative h-full rounded-full"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">
            {Object.keys(selectedAnswers).length} / {totalQuestions} answered
          </span>
        </div>
      </div>

      {/* Question avec animation */}
      <div className="animate-scale-in">
        <QuestionComponent
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
          showResult={showResults}
          correctAnswer={correctAnswerKey}
        />
      </div>

      {/* Boutons de navigation modernisés */}
      <div className="flex justify-between items-center mt-8 gap-4 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <button
          onClick={handlePrevious}
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

        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className={`
            flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg
            ${
              !selectedAnswer
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-gray-900 text-white hover:bg-black transform hover:scale-105 active:scale-95 hover:shadow-xl'
            }
          `}
        >
          {currentQuestionIndex === totalQuestions - 1 ? (
            <>
              Finish Quiz
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </>
          ) : (
            <>
              Next Question
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

