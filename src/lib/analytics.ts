// Fonctions utilitaires pour Google Analytics

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Envoie un événement à Google Analytics
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track le début d'un quiz
 */
export const trackQuizStart = (quizId: number, quizTitle: string) => {
  trackEvent('quiz_start', 'Quiz', quizTitle, quizId);
};

/**
 * Track la fin d'un quiz avec les résultats
 */
export const trackQuizComplete = (
  quizId: number,
  quizTitle: string,
  score: number,
  percentage: number,
  timeSpent: number
) => {
  trackEvent('quiz_complete', 'Quiz', quizTitle, quizId);
  trackEvent('quiz_score', 'Quiz', `${quizTitle} - ${percentage}%`, percentage);
  trackEvent('quiz_time', 'Quiz', quizTitle, timeSpent);
};

/**
 * Track la sélection d'une réponse
 */
export const trackAnswerSelect = (quizId: number, questionIndex: number) => {
  trackEvent('answer_select', 'Quiz', `Question ${questionIndex}`, quizId);
};

/**
 * Track le partage social
 */
export const trackSocialShare = (platform: string, quizTitle: string) => {
  trackEvent('share', 'Social', `${platform} - ${quizTitle}`);
};

/**
 * Track la navigation vers un quiz similaire
 */
export const trackSimilarQuizClick = (quizId: number, quizTitle: string) => {
  trackEvent('similar_quiz_click', 'Quiz', quizTitle, quizId);
};



