// Types pour les Quiz
export interface Quiz {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  featured_media_url?: string;
  acf?: {
    duree_estimee?: number;
    niveau_difficulte?: 'Facile' | 'Moyen' | 'Difficile' | 'Expert';
    categorie?: string;
    nombre_questions?: number;
    score_minimum?: number;
    ordre_questions?: 'Fixe' | 'Aleatoire';
    questions?: Question[];
    quiz_similaires?: number[];
  };
  categories?: number[];
  date: string;
  modified: string;
}

// Types pour les Questions
// Peut être une question WordPress ou une question du Repeater ACF
export interface Question {
  id?: number;
  // Pour questions WordPress
  title?: {
    rendered: string;
  };
  content?: {
    rendered: string;
  };
  // Pour questions du Repeater ACF (dans quiz.acf.questions)
  texte_question?: string;
  type_question?: 'QCM' | 'VraiFaux' | 'TexteLibre' | 'Image';
  media?: string; // URL de l'image
  media_url?: string;
  explication?: string;
  points?: number;
  temps_limite?: number;
  reponses?: Answer[];
  // ACF pour questions WordPress indépendantes
  acf?: {
    type_question?: 'QCM' | 'VraiFaux' | 'TexteLibre' | 'Image';
    media?: number;
    media_url?: string;
    explication?: string;
    reponses?: Answer[];
    points?: number;
    temps_limite?: number;
  };
}

// Types pour les Réponses
export interface Answer {
  texte: string;
  correcte: boolean;
  explication?: string;
}

// Types pour les Catégories
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

// Types pour les Statistiques
export interface Stats {
  total_quiz: number;
  total_questions: number;
  total_categories: number;
  quiz_par_categorie: Record<string, number>;
}

// Types pour les résultats de quiz
export interface QuizResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  timeExpired?: boolean; // Indique si le quiz a été fermé automatiquement à cause du temps
  answers: {
    questionId: number;
    selectedAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
  }[];
}

