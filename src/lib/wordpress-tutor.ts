import axios from 'axios';
import type { Quiz, Question, Category, Stats } from './types';

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost/test2';

// Configuration axios pour l'API WordPress
const apiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/wp/v2`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client pour l'API Tutor LMS
const tutorApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/tutor/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Convertit une question Tutor LMS en format Question
 */
function normalizeTutorQuestion(tutorQuestion: any): Question {
  // Tutor LMS structure peut varier, on s'adapte
  const questionText = tutorQuestion.question_title || tutorQuestion.question || tutorQuestion.title || '';
  const questionType = tutorQuestion.question_type || 'multiple_choice';
  
  // Normaliser les réponses
  const answers = (tutorQuestion.answers || []).map((ans: any) => ({
    texte: ans.answer_title || ans.answer || ans.text || '',
    correcte: ans.is_correct === true || ans.is_correct === 1 || ans.correct === true,
    explication: ans.answer_explanation || ans.explanation || '',
  }));

  return {
    id: tutorQuestion.question_id || tutorQuestion.id,
    texte_question: questionText,
    type_question: questionType === 'true_false' ? 'VraiFaux' : 'QCM',
    explication: tutorQuestion.answer_explanation || tutorQuestion.explanation || '',
    points: tutorQuestion.points || tutorQuestion.question_mark || 1,
    temps_limite: tutorQuestion.time_limit || undefined,
    reponses: answers,
  };
}

/**
 * Convertit un quiz Tutor LMS en format Quiz
 */
function normalizeTutorQuiz(tutorQuiz: any, questions: Question[] = []): Quiz {
  return {
    id: tutorQuiz.ID || tutorQuiz.id,
    slug: tutorQuiz.post_name || tutorQuiz.slug,
    title: {
      rendered: tutorQuiz.post_title || tutorQuiz.title || '',
    },
    content: {
      rendered: tutorQuiz.post_content || tutorQuiz.content || '',
    },
    excerpt: {
      rendered: tutorQuiz.post_excerpt || tutorQuiz.excerpt || '',
    },
    featured_media: tutorQuiz.featured_image_id || 0,
    featured_media_url: tutorQuiz.featured_image_url || undefined,
    acf: {
      duree_estimee: tutorQuiz.time_limit ?? tutorQuiz.duration ?? undefined,
      niveau_difficulte: tutorQuiz.difficulty || 'Moyen',
      categorie: tutorQuiz.category || '',
      nombre_questions: questions.length || tutorQuiz.question_count || 0,
      score_minimum: tutorQuiz.passing_grade || 70,
      ordre_questions: tutorQuiz.randomize_questions ? 'Aleatoire' : 'Fixe',
      questions: questions,
    },
    categories: tutorQuiz.categories || [],
    date: tutorQuiz.post_date || new Date().toISOString(),
    modified: tutorQuiz.post_modified || new Date().toISOString(),
  };
}

/**
 * Récupère tous les quiz Tutor LMS
 */
export async function getAllQuiz(): Promise<Quiz[]> {
  try {
    // Récupérer les quiz depuis Tutor LMS
    const response = await apiClient.get('/tutor_quiz', {
      params: {
        per_page: 100,
        _embed: true,
        status: 'publish',
      },
    });

    // Pour chaque quiz, récupérer les questions
    const quizs = await Promise.all(
      response.data.map(async (tutorQuiz: any) => {
        let questions: Question[] = [];
        
        try {
          // Récupérer les questions du quiz
          const questionsResponse = await tutorApiClient.get(`/quiz/${tutorQuiz.ID || tutorQuiz.id}/questions`);
          questions = (questionsResponse.data || []).map(normalizeTutorQuestion);
        } catch (error) {
          console.error(`Erreur récupération questions pour quiz ${tutorQuiz.ID}:`, error);
        }

        // Récupérer l'image featured si disponible
        let featuredMediaUrl = undefined;
        if (tutorQuiz.featured_image_id) {
          try {
            const mediaResponse = await axios.get(
              `${WORDPRESS_API_URL}/wp-json/wp/v2/media/${tutorQuiz.featured_image_id}`
            );
            featuredMediaUrl = mediaResponse.data.source_url;
          } catch (error) {
            console.error(`Erreur récupération média:`, error);
          }
        }

        const normalizedQuiz = normalizeTutorQuiz(tutorQuiz, questions);
        if (featuredMediaUrl) {
          normalizedQuiz.featured_media_url = featuredMediaUrl;
        }

        return normalizedQuiz;
      })
    );

    return quizs;
  } catch (error) {
    console.error('Erreur récupération quiz Tutor LMS:', error);
    return [];
  }
}

/**
 * Récupère un quiz spécifique par son slug
 */
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  try {
    // Récupérer le quiz
    const response = await apiClient.get('/tutor_quiz', {
      params: {
        slug,
        _embed: true,
        status: 'publish',
      },
    });

    if (response.data.length === 0) {
      return null;
    }

    const tutorQuiz = response.data[0];

    // Récupérer les questions
    let questions: Question[] = [];
    try {
      const questionsResponse = await tutorApiClient.get(`/quiz/${tutorQuiz.ID || tutorQuiz.id}/questions`);
      questions = (questionsResponse.data || []).map(normalizeTutorQuestion);
    } catch (error) {
      console.error(`Erreur récupération questions:`, error);
    }

    // Récupérer l'image featured
    let featuredMediaUrl = undefined;
    if (tutorQuiz.featured_image_id) {
      try {
        const mediaResponse = await axios.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/media/${tutorQuiz.featured_image_id}`
        );
        featuredMediaUrl = mediaResponse.data.source_url;
      } catch (error) {
        console.error(`Erreur récupération média:`, error);
      }
    }

    const normalizedQuiz = normalizeTutorQuiz(tutorQuiz, questions);
    if (featuredMediaUrl) {
      normalizedQuiz.featured_media_url = featuredMediaUrl;
    }

    return normalizedQuiz;
  } catch (error) {
    console.error(`Erreur récupération quiz ${slug}:`, error);
    return null;
  }
}

/**
 * Récupère les quiz d'une catégorie spécifique
 */
export async function getQuizByCategory(categorySlug: string): Promise<Quiz[]> {
  try {
    // Récupérer l'ID de la catégorie
    const categoryResponse = await axios.get(
      `${WORDPRESS_API_URL}/wp-json/wp/v2/categories`,
      {
        params: {
          slug: categorySlug,
        },
      }
    );

    if (categoryResponse.data.length === 0) {
      return [];
    }

    const categoryId = categoryResponse.data[0].id;

    // Récupérer les quiz de cette catégorie
    const response = await apiClient.get('/tutor_quiz', {
      params: {
        categories: categoryId,
        per_page: 100,
        _embed: true,
        status: 'publish',
      },
    });

    // Pour chaque quiz, récupérer les questions
    const quizs = await Promise.all(
      response.data.map(async (tutorQuiz: any) => {
        let questions: Question[] = [];
        
        try {
          const questionsResponse = await tutorApiClient.get(`/quiz/${tutorQuiz.ID || tutorQuiz.id}/questions`);
          questions = (questionsResponse.data || []).map(normalizeTutorQuestion);
        } catch (error) {
          console.error(`Erreur récupération questions:`, error);
        }

        return normalizeTutorQuiz(tutorQuiz, questions);
      })
    );

    return quizs;
  } catch (error) {
    console.error(`Erreur récupération quiz catégorie ${categorySlug}:`, error);
    return [];
  }
}

/**
 * Récupère toutes les catégories
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const response = await axios.get(`${WORDPRESS_API_URL}/wp-json/wp/v2/categories`, {
      params: {
        per_page: 100,
      },
    });

    return response.data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      count: cat.count || 0,
    }));
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    return [];
  }
}

/**
 * Récupère les statistiques globales
 */
export async function getStats(): Promise<Stats> {
  try {
    const quizs = await getAllQuiz();
    const categories = await getAllCategories();

    const quizParCategorie: Record<string, number> = {};
    categories.forEach((cat) => {
      quizParCategorie[cat.slug] = cat.count;
    });

    const totalQuestions = quizs.reduce((acc, quiz) => {
      return acc + (quiz.acf?.nombre_questions || 0);
    }, 0);

    return {
      total_quiz: quizs.length,
      total_questions: totalQuestions,
      total_categories: categories.length,
      quiz_par_categorie: quizParCategorie,
    };
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    return {
      total_quiz: 0,
      total_questions: 0,
      total_categories: 0,
      quiz_par_categorie: {},
    };
  }
}

/**
 * Récupère tous les slugs de quiz pour la génération statique
 */
export async function getAllQuizSlugs(): Promise<string[]> {
  try {
    const response = await apiClient.get('/tutor_quiz', {
      params: {
        per_page: 100,
        _fields: 'slug,post_name',
        status: 'publish',
      },
    });

    return response.data.map((quiz: any) => quiz.post_name || quiz.slug || '');
  } catch (error) {
    console.error('Erreur récupération slugs:', error);
    return [];
  }
}



