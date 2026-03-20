'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Quiz, Question } from '@/lib/types';
import type { QuizResults } from '@/lib/types';
import QuestionComponent from './Question';
import Results from './Results';
import QuizSidebar from './QuizSidebar';
import { shuffleArray } from '@/lib/utils';
import { trackQuizStart, trackAnswerSelect, trackQuizComplete } from '@/lib/analytics';
import { saveQuizAttempt } from '@/lib/auth-client';

interface QuizPlayerProps {
  quiz: Quiz;
  /** Appelé quand l'utilisateur clique sur "Skip Question" (rafraîchit les pubs) */
  onSkipQuestion?: () => void;
}

export default function QuizPlayer({ quiz, onSkipQuestion }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [startTime] = useState(Date.now());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // Timer pour la question actuelle
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number | null>(null); // Timer global pour le quiz
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

    // Initialiser les questions et charger la progression sauvegardée
  useEffect(() => {
    const quizQuestions = quiz.acf?.questions || [];

    // En production on évite les logs lourds qui ralentissent le rendu
    if (process.env.NODE_ENV !== 'production') {
      console.log('🎮 QuizPlayer - Initialisation:', {
        quizId: quiz.id,
        quizTitle: quiz.title.rendered,
        questionsCount: quizQuestions.length,
        hasAcf: !!quiz.acf,
        hasQuestions: !!quiz.acf?.questions,
        questionsType: Array.isArray(quizQuestions) ? 'array' : typeof quizQuestions,
        firstQuestion: quizQuestions[0]
          ? {
              id: quizQuestions[0].id,
              texte_question: quizQuestions[0].texte_question?.substring(0, 50),
              reponsesCount: quizQuestions[0].reponses?.length || 0,
            }
          : null,
      });

      if (quizQuestions.length === 0) {
        console.warn('⚠️ No questions available in quiz.acf.questions');
      }

      // Vérifier que chaque question a des réponses (debug uniquement)
      quizQuestions.forEach((q: any, index: number) => {
        const answers = q.reponses || q.acf?.reponses || [];
        if (answers.length === 0) {
          console.error(`❌ Question ${index + 1} (ID: ${q.id}) n'a pas de réponses`, {
            question: q.texte_question?.substring(0, 50),
            hasReponses: !!q.reponses,
            hasAcfReponses: !!q.acf?.reponses,
          });
        }
      });
    }
    
    // Mélanger les questions si l'ordre est aléatoire
    if (quiz.acf?.ordre_questions === 'Aleatoire') {
      setQuestions(shuffleArray(quizQuestions));
    } else {
      setQuestions(quizQuestions);
    }

    // Vérifier si on doit réinitialiser (paramètre URL ?reset=true)
    // Vérifier que window existe (côté client uniquement)
    let shouldReset = false;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      shouldReset = urlParams.get('reset') === 'true';
      
      if (shouldReset) {
        // Nettoyer la progression sauvegardée
        localStorage.removeItem(`quiz-progress-${quiz.id}`);
        localStorage.removeItem(`quiz-timer-${quiz.id}`);
        localStorage.removeItem(`quiz-start-time-${quiz.id}`);
        localStorage.removeItem(`quiz-flags-${quiz.id}`);
        // Réinitialiser l'état
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setQuizCompleted(false);
        setResults(null);
        setShowResults(false);
        setFlaggedQuestions(new Set());
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
        
        // Charger les questions marquées
        const savedFlags = localStorage.getItem(`quiz-flags-${quiz.id}`);
        if (savedFlags) {
          try {
            const flags = JSON.parse(savedFlags);
            setFlaggedQuestions(new Set(flags));
          } catch (error) {
            console.error('Error loading flags:', error);
          }
        }
      }
    }

    // Initialiser le timer global du quiz (en secondes)
    // Si duree_estimee est vide, null, 0 ou non défini, le quiz fonctionne sans limite de temps
    const dureeEstimee = quiz.acf?.duree_estimee;
    if (dureeEstimee && dureeEstimee > 0) {
      // Convertir les minutes en secondes
      const quizDurationSeconds = dureeEstimee * 60;
      
      // Vérifier si on a un timer sauvegardé
      if (typeof window !== 'undefined' && !shouldReset) {
        const savedStartTime = localStorage.getItem(`quiz-start-time-${quiz.id}`);
        const savedTimeRemaining = localStorage.getItem(`quiz-timer-${quiz.id}`);
        
        if (savedStartTime && savedTimeRemaining) {
          try {
            const startTimeSaved = parseInt(savedStartTime);
            const timeRemainingSaved = parseInt(savedTimeRemaining);
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTimeSaved) / 1000);
            const remainingSeconds = timeRemainingSaved - elapsedSeconds;
            
            if (remainingSeconds > 0) {
              // Continuer le timer depuis où il s'était arrêté
              setQuizTimeRemaining(remainingSeconds);
            } else {
              // Le temps est écoulé, initialiser à 0
              setQuizTimeRemaining(0);
            }
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Error loading timer:', error);
            }
            setQuizTimeRemaining(quizDurationSeconds);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`quiz-start-time-${quiz.id}`, Date.now().toString());
            }
          }
        } else {
          // Pas de timer sauvegardé, initialiser normalement
          setQuizTimeRemaining(quizDurationSeconds);
          // Sauvegarder l'heure de début
          if (typeof window !== 'undefined') {
            localStorage.setItem(`quiz-start-time-${quiz.id}`, Date.now().toString());
          }
        }
      } else {
        // Reset ou première fois, initialiser normalement
        setQuizTimeRemaining(quizDurationSeconds);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`quiz-start-time-${quiz.id}`, Date.now().toString());
        }
      }
    } else {
      setQuizTimeRemaining(null);
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

  // Définir calculateResults AVANT les useEffect qui l'utilisent
  const calculateResults = useCallback(async () => {
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    const answerDetails: QuizResults['answers'] = [];

    questions.forEach((question, index) => {
      const selectedAnswerKey = selectedAnswers[index];
      // Gérer les deux formats : Repeater ACF ou Question WordPress
      const answers = question.reponses || question.acf?.reponses || [];
      const questionType = question.type_question || question.acf?.type_question || 'QCM';
      const isTextInput = questionType === 'TexteLibre' || questionType === 'text_input' || questionType === 'open_ended';
      
      let selectedAnswer: any = null;
      let isCorrect = false;
      let selectedAnswerIndex: number = -1;
      
      if (isTextInput) {
        // Pour les questions texte libre, selectedAnswerKey contient "text:..." ou juste le texte
        const userText = selectedAnswerKey?.startsWith('text:') 
          ? selectedAnswerKey.replace('text:', '').trim()
          : (selectedAnswerKey || '').trim();
        
        if (userText) {
          // Comparer avec toutes les réponses attendues (insensible à la casse)
          const normalizedUserText = userText.toLowerCase().trim();
          
          // Trouver toutes les réponses correctes possibles
          const correctAnswers = answers.filter((a: any) => 
            a.correcte === true || 
            a.correcte === 1 || 
            a.correcte === 'yes' ||
            a.is_correct === true ||
            a.is_correct === 1 ||
            a.is_correct === 'yes' ||
            a.correct === true
          );
          
          // Si aucune réponse n'est marquée comme correcte, utiliser toutes les réponses comme références
          const referenceAnswers = correctAnswers.length > 0 ? correctAnswers : answers;
          
          // Comparer avec chaque réponse de référence
          for (const refAnswer of referenceAnswers) {
            const refText = (refAnswer.texte || '').toLowerCase().trim();
            if (refText && normalizedUserText === refText) {
              isCorrect = true;
              selectedAnswer = { texte: userText, correcte: true };
              break;
            }
            // Comparaison partielle (contient les mots-clés importants)
            if (refText && normalizedUserText.includes(refText) || refText.includes(normalizedUserText)) {
              // Pour une correspondance partielle, on peut considérer comme correcte
              // ou laisser l'admin décider
              isCorrect = true;
              selectedAnswer = { texte: userText, correcte: true };
              break;
            }
          }
          
          // Si aucune correspondance exacte, créer une réponse pour l'affichage
          if (!selectedAnswer) {
            selectedAnswer = { texte: userText, correcte: false };
          }
        }
      } else {
        // Logique existante pour QCM et Vrai/Faux
        selectedAnswerIndex = selectedAnswerKey
          ? parseInt(selectedAnswerKey.split('-')[1])
          : -1;
        
        selectedAnswer = selectedAnswerIndex >= 0 && selectedAnswerIndex < answers.length 
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
      }

      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      answerDetails.push({
        questionId: question.id || index,
        selectedAnswer: selectedAnswer?.texte || 'No answer',
        isCorrect,
        correctAnswer: correctAnswer?.texte || 'Unknown',
      });
    });

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const minimumScore = quiz.acf?.score_minimum || 70;

    // Vérifier si le quiz a été fermé à cause du temps écoulé
    const timeExpired = quizTimeRemaining !== null && quizTimeRemaining <= 0;

    const quizResults: QuizResults = {
      score: correctAnswers,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      percentage,
      passed: percentage >= minimumScore,
      timeSpent,
      timeExpired,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, selectedAnswers, startTime, quiz, quizTimeRemaining, totalQuestions]);
  // Note: correctAnswer est une variable locale dans le forEach, pas besoin dans les dépendances

  // Gérer le timer global du quiz
  useEffect(() => {
    if (quizTimeRemaining === null || quizCompleted) return;

    const interval = setInterval(() => {
      setQuizTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          // Le temps est écoulé, fermer automatiquement le quiz
          if (!quizCompleted) {
            console.log('⏱️ Temps écoulé ! Fermeture automatique du quiz...');
            // Nettoyer le timer sauvegardé
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`quiz-timer-${quiz.id}`);
              localStorage.removeItem(`quiz-start-time-${quiz.id}`);
            }
            calculateResults();
          }
          return 0;
        }
        const newTime = prev - 1;
        // Sauvegarder le temps restant dans localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`quiz-timer-${quiz.id}`, newTime.toString());
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizTimeRemaining, quizCompleted, calculateResults, quiz.id]);

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
    const isSkip = !selectedAnswers[currentQuestionIndex];
    if (isSkip && onSkipQuestion) {
      onSkipQuestion();
    }
    // Permettre de passer même sans réponse sélectionnée
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    } else {
      // Dernière question, calculer les résultats
      await calculateResults();
    }
  };

  const handleQuestionSelect = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
      setQuestionStartTime(Date.now());
    }
  };

  const toggleFlag = (index: number) => {
    setFlaggedQuestions((prev) => {
      const newFlags = new Set(prev);
      if (newFlags.has(index)) {
        newFlags.delete(index);
      } else {
        newFlags.add(index);
      }
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`quiz-flags-${quiz.id}`, JSON.stringify(Array.from(newFlags)));
      }
      return newFlags;
    });
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
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
        questions={questions}
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
    <div className="flex items-start gap-0 animate-fade-in relative">
      {/* Bouton toggle pour afficher la sidebar quand elle est cachée */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden lg:flex absolute top-0 left-4 z-50 p-3 rounded-xl shadow-lg transition-all duration-300 bg-white text-gray-900 border-2 border-gray-300 hover:border-gray-900 hover:shadow-xl transform hover:scale-110 active:scale-95"
          aria-label="Show sidebar"
          title="Show question list"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Sidebar - À gauche, peut être cachée, relative au conteneur */}
      <QuizSidebar
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        selectedAnswers={selectedAnswers}
        onQuestionSelect={handleQuestionSelect}
        isOpen={sidebarOpen}
        flaggedQuestions={flaggedQuestions}
        onToggleFlag={toggleFlag}
      />
      
      {/* Contenu principal */}
      <div className="flex-1 max-w-4xl mx-auto px-4 transition-all duration-300">
      {/* Alerte si le temps est presque écoulé */}
      {quizTimeRemaining !== null && quizTimeRemaining <= 60 && quizTimeRemaining > 0 && !quizCompleted && (
        <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold text-red-900">
                ⚠️ Warning! Less than one minute remaining!
              </p>
              <p className="text-sm text-red-700 mt-1">
                The quiz will close automatically when time runs out.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
            {/* Timer global du quiz */}
            {quizTimeRemaining !== null ? (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold transition-all duration-300 ${
                quizTimeRemaining <= 60 
                  ? 'border-red-500 bg-red-50 text-red-700 animate-pulse shadow-lg' 
                  : quizTimeRemaining <= 180
                  ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                  : 'border-blue-500 bg-blue-50 text-blue-700'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold text-lg">
                  {Math.floor(quizTimeRemaining / 60)}:{(quizTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs opacity-75">Timer</span>
              </div>
            ) : (
              // Indicateur pour quiz sans limite de temps
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 bg-gray-50 text-gray-600 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">No time limit</span>
              </div>
            )}
            {/* Timer pour la question actuelle */}
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
                <span className="text-xs opacity-75">Question</span>
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
          className={`
            flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg
            ${
              selectedAnswer
                ? 'bg-gray-900 text-white hover:bg-black transform hover:scale-105 active:scale-95 hover:shadow-xl'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transform hover:scale-105 active:scale-95 border-2 border-gray-400'
            }
          `}
        >
          {currentQuestionIndex === totalQuestions - 1 ? (
            <>
              {selectedAnswer ? 'Finish Quiz' : 'Finish Quiz (Skip)'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </>
          ) : (
            <>
              {selectedAnswer ? 'Next Question' : 'Skip Question'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
      </div>
    </div>
  );
}

