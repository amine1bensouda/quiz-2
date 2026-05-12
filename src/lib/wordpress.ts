import axios from 'axios';
import { unstable_cache } from 'next/cache';
import type { Quiz, Question, Category, Stats } from './types';

// En production/build, ne pas appeler localhost (évite 404 pendant le build Hostinger)
const _wpUrl = process.env.WORDPRESS_API_URL || '';
const WORDPRESS_API_URL = (process.env.NODE_ENV === 'production' && (!_wpUrl || _wpUrl.includes('localhost')))
  ? ''
  : (_wpUrl || 'http://localhost/test2');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Configuration axios pour l'API WordPress
const apiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/wp/v2`,
  timeout: 8000, // Réduire le timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client pour l'API Tutor LMS
const tutorApiClient = axios.create({
  baseURL: `${WORDPRESS_API_URL}/wp-json/tutor/v1`,
  timeout: 15000, // Réduire le timeout à 15 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fonction helper pour logger uniquement en développement
const log = (...args: any[]) => {
  if (!IS_PRODUCTION) {
    console.log(...args);
  }
};

const logWarn = (...args: any[]) => {
  if (!IS_PRODUCTION) {
    console.warn(...args);
  }
};

const logError = (...args: any[]) => {
  console.error(...args);
};

/**
 * Convertit une question Tutor LMS en format Question
 */
function normalizeTutorQuestion(tutorQuestion: any): Question {
  // Fonction pour vérifier si un texte est valide (pas sérialisé, pas vide)
  const isValidText = (text: any): boolean => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (trimmed === '') return false;
    // Vérifier si c'est du code sérialisé PHP
    if (trimmed.match(/^(a:\d+:\{|s:\d+:|O:\d+:|i:\d+|b:[01]|d:|N;)/)) return false;
    if (trimmed.match(/[a-z]:\d+:/g) && trimmed.match(/[a-z]:\d+:/g)!.length > 3) return false;
    return true;
  };
  
  // Essayer plusieurs champs possibles pour le texte de la question
  let questionText = '';
  
  // Liste de tous les champs possibles à vérifier
  const possibleFields = [
    'question_title',
    'question',
    'title',
    'question_name',
    'question_text',
    'content',
    'post_title',
    'post_content',
    'name',
    'text',
    'question_content',
    'question_description'
  ];
  
  // Chercher dans les champs principaux
  for (const field of possibleFields) {
    const value = tutorQuestion[field];
    if (isValidText(value)) {
      questionText = value;
      log(`  ✅ Texte trouvé dans: ${field}`);
      break;
    }
    // Si c'est un objet avec rendered
    if (value && typeof value === 'object' && value.rendered && isValidText(value.rendered)) {
      questionText = value.rendered;
      log(`  ✅ Texte trouvé dans: ${field}.rendered`);
      break;
    }
  }
  
  // Si le texte est toujours vide, essayer d'extraire depuis _debug
  if (!questionText && tutorQuestion._debug) {
    const debug = tutorQuestion._debug;
    const debugFields = ['raw_question_title', 'raw_question_name', 'raw_question', 'question_title', 'question_name', 'question'];
    
    for (const field of debugFields) {
      if (isValidText(debug[field])) {
        questionText = debug[field];
        log(`  ✅ Texte trouvé dans _debug.${field}`);
        break;
      }
    }
    
    // Si toujours vide, essayer depuis all_fields
    if (!questionText && debug.all_fields) {
      const allFields = debug.all_fields;
      for (const field of possibleFields) {
        if (isValidText(allFields[field])) {
          questionText = allFields[field];
          log(`  ✅ Texte trouvé dans _debug.all_fields.${field}`);
          break;
        }
      }
    }
  }
  
  // Si toujours vide, chercher récursivement dans tous les champs de l'objet
  if (!questionText) {
    const searchRecursive = (obj: any, depth = 0): string => {
      if (depth > 3) return ''; // Limiter la profondeur
      if (!obj || typeof obj !== 'object') return '';
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (isValidText(value)) {
            log(`  ✅ Texte trouvé récursivement dans: ${key}`);
            return value;
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const found = searchRecursive(value, depth + 1);
            if (found) return found;
          }
        }
      }
      return '';
    };
    
    questionText = searchRecursive(tutorQuestion);
  }
  
  const questionType = tutorQuestion.question_type || 'multiple_choice';
  
  // IMPORTANT :
  // Ne pas nettoyer agressivement le HTML ici.
  // On laisse le contenu tel quel (avec ses balises) pour que le composant
  // `MathRenderer` et le rendu React gèrent correctement :
  // - les retours à la ligne (<p>, <br>, <div>)
  // - les formules LaTeX ($...$, $$...$$)
  // - la mise en forme typographique
  //
  // On se contente juste de s'assurer qu'on renvoie une chaîne.
  const keepHtml = (html: any): string => {
    if (!html) return '';
    if (typeof html === 'string') return html;
    // Certains champs peuvent être de la forme { rendered: '...' }
    if (html.rendered && typeof html.rendered === 'string') return html.rendered;
    return String(html);
  };
  
  // Si toujours pas de texte, utiliser un message par défaut avec l'ID
  if (!questionText || questionText.trim() === '') {
    const questionId = tutorQuestion.question_id || tutorQuestion.id || 'unknown';
    questionText = `Question ${questionId}`;
    logWarn(`  ⚠️ Aucun texte valide trouvé pour la question ${questionId}, utilisation du message par défaut`);
    logWarn('  📋 Clés disponibles:', Object.keys(tutorQuestion));
  }
  
  // Normaliser les réponses
  const answers = (tutorQuestion.answers || []).map((ans: any) => {
    let answerText = ans.answer_title || ans.answer || ans.text || ans.answer_text || ans.answer_name || '';
    
    // Vérifier si c'est du code sérialisé
    if (answerText && (answerText.startsWith('a:') || answerText.startsWith('s:') || answerText.match(/^[a-z]:\d+:/))) {
      logWarn('⚠️ Texte de réponse semble être du code sérialisé');
      answerText = ans.answer || ans.text || ans.answer_text || '';
    }
    
    const explanationText = ans.answer_explanation || ans.explanation || ans.answer_explanation_text || '';
    
    // Vérifier plusieurs formats pour is_correct (le plugin WordPress renvoie maintenant un booléen)
    const isCorrect = ans.is_correct === true || 
                      ans.is_correct === 1 || 
                      ans.is_correct === 'yes' ||
                      ans.is_correct === '1' ||
                      ans.correct === true ||
                      ans.correct === 1 ||
                      ans.correct === 'yes';
    
    return {
      // On garde le HTML et les formules, ils seront nettoyés/affichés plus tard
      texte: keepHtml(answerText),
      correcte: isCorrect,
      explication: keepHtml(explanationText),
    };
  });

  // Log pour déboguer la structure complète si le texte est toujours vide
  if (!questionText || questionText.trim() === '') {
    logWarn('  ⚠️ Texte de question vide ! Structure complète:', {
      keys: Object.keys(tutorQuestion),
      question_title: tutorQuestion.question_title,
      question: tutorQuestion.question,
      title: tutorQuestion.title,
      question_name: tutorQuestion.question_name,
      question_text: tutorQuestion.question_text,
      _debug: tutorQuestion._debug ? {
        raw_question_title: tutorQuestion._debug.raw_question_title,
        raw_question_name: tutorQuestion._debug.raw_question_name,
        all_fields_keys: tutorQuestion._debug.all_fields ? Object.keys(tutorQuestion._debug.all_fields) : null,
      } : null,
      fullObject: JSON.stringify(tutorQuestion, null, 2).substring(0, 1000),
    });
  }
  
  log('  📝 Question normalisée:', {
    id: tutorQuestion.question_id || tutorQuestion.id,
    texte: questionText ? (questionText.substring(0, 50) + '...') : 'VIDE',
    type: questionType,
    answersCount: answers.length,
  });

  // Nettoyer l'explication générale aussi
  const generalExplanation = tutorQuestion.answer_explanation || tutorQuestion.explanation || '';

  return {
    id: tutorQuestion.question_id || tutorQuestion.id,
    // On garde le HTML et les formules, le composant d'affichage fera le rendu propre
    texte_question: keepHtml(questionText) || 'Question sans titre',
    type_question: questionType === 'true_false' ? 'VraiFaux' : 'QCM',
    explication: keepHtml(generalExplanation),
    points: tutorQuestion.points || tutorQuestion.question_mark || 1,
    temps_limite: tutorQuestion.time_limit || undefined,
    reponses: answers,
  };
}

/**
 * Convertit un quiz Tutor LMS en format Quiz
 */
function normalizeTutorQuiz(tutorQuiz: any, questions: Question[] = []): Quiz {
  // Extraire les paramètres du quiz depuis quiz_settings
  const quizSettings = tutorQuiz.quiz_settings?.[0] || {};
  const timeLimit = quizSettings.time_limit || {};
  const timeValue = timeLimit.time_value ? parseInt(timeLimit.time_value) : 0;
  const timeType = timeLimit.time_type || 'minutes';
  
  // Convertir le temps en minutes si nécessaire
  let duration = timeValue;
  if (timeType === 'hours') {
    duration = timeValue * 60;
  } else if (timeType === 'seconds') {
    duration = Math.ceil(timeValue / 60);
  }
  
  // Si pas de durée (0 ou non défini), le quiz est en temps libre (aucun chronomètre)
  const passingGrade = quizSettings.passing_grade ? parseInt(quizSettings.passing_grade) : 70;
  const questionsOrder = quizSettings.questions_order === 'rand' ? 'Aleatoire' : 'Fixe';
  const maxQuestions = quizSettings.max_questions_for_answer ? parseInt(quizSettings.max_questions_for_answer) : questions.length || 0;
  
  return {
    id: tutorQuiz.ID || tutorQuiz.id,
    slug: tutorQuiz.post_name || tutorQuiz.slug,
    title: {
      rendered: tutorQuiz.post_title || tutorQuiz.title?.rendered || tutorQuiz.title || '',
    },
    content: {
      rendered: tutorQuiz.post_content || tutorQuiz.content?.rendered || tutorQuiz.content || '',
    },
    excerpt: {
      rendered: tutorQuiz.post_excerpt || tutorQuiz.excerpt?.rendered || tutorQuiz.excerpt || '',
    },
    featured_media: tutorQuiz.featured_image_id || tutorQuiz.featured_media || 0,
    featured_media_url: tutorQuiz.featured_image_url || undefined,
    acf: {
      duree_estimee: duration && duration > 0 ? duration : undefined,
      niveau_difficulte: tutorQuiz.difficulty || 'Intermediate',
      categorie: tutorQuiz.category || '',
      nombre_questions: maxQuestions || questions.length || 0,
      score_minimum: passingGrade,
      ordre_questions: questionsOrder,
      questions: questions,
    },
    categories: tutorQuiz.categories || [],
    date: tutorQuiz.post_date || new Date().toISOString(),
    modified: tutorQuiz.post_modified || new Date().toISOString(),
  };
}

/**
 * Récupère tous les quiz avec leurs questions (Tutor LMS)
 * Mise en cache pour améliorer les performances
 */
async function _getAllQuizUncached(): Promise<Quiz[]> {
  if (!WORDPRESS_API_URL) return [];
  try {
    const response = await tutorApiClient.get('/quizzes', {
      params: {
        per_page: 100,
      },
    });

    // Debug: Afficher la structure de la réponse
    log('🔍 Structure de la réponse API:', {
      hasData: !!response.data,
      hasDataData: !!response.data?.data,
      isArray: Array.isArray(response.data),
      isDataArray: Array.isArray(response.data?.data),
      dataKeys: response.data ? Object.keys(response.data) : [],
      firstItem: response.data?.data?.[0] || response.data?.[0] || null,
    });

    // Gérer la structure de réponse {code, message, data} ou directement un tableau
    let quizzesData: any[] = [];
    
    if (response.data) {
      // Si c'est un objet avec code/message/data
      if (response.data.code && response.data.data) {
        quizzesData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      // Si c'est directement un tableau
      else if (Array.isArray(response.data)) {
        quizzesData = response.data;
      }
      // Si c'est un objet avec une propriété data qui est un tableau
      else if (response.data.data && Array.isArray(response.data.data)) {
        quizzesData = response.data.data;
      }
    }
    
    if (!Array.isArray(quizzesData) || quizzesData.length === 0) {
      logError('❌ Format de réponse inattendu ou aucun quiz:', {
        type: typeof response.data,
        isArray: Array.isArray(response.data),
        hasData: !!response.data?.data,
        keys: response.data ? Object.keys(response.data) : [],
        firstItem: response.data?.[0] || response.data?.data?.[0] || null,
      });
      return [];
    }

    log(`✅ ${quizzesData.length} quiz récupérés depuis l'API`);

    // Pour chaque quiz, normaliser sans récupérer les questions immédiatement
    // Les questions seront récupérées à la demande lors de l'affichage du quiz
    const quizs = quizzesData.map((tutorQuiz: any) => {
      const quizId = tutorQuiz.ID || tutorQuiz.id;
      log(`📝 Traitement du quiz ID: ${quizId}, titre: ${tutorQuiz.post_title || tutorQuiz.title}`);
      
      // Normaliser le quiz sans questions pour l'instant
      // Les questions seront récupérées dans getQuizBySlug
      const normalizedQuiz = normalizeTutorQuiz(tutorQuiz, []);
      log(`  ✅ Quiz normalisé: ${normalizedQuiz.title.rendered}`);
      return normalizedQuiz;
    });

    log(`🎉 Total: ${quizs.length} quiz normalisés retournés`);
    return quizs;
  } catch (error) {
    logError('Erreur récupération quiz Tutor LMS:', error);
    return [];
  }
}

// Version avec cache (uniquement pour Server Components)
// Note: unstable_cache ne fonctionne que dans les Server Components
// Pour les composants client, utilisez les routes API
export async function getAllQuiz(): Promise<Quiz[]> {
  try {
    // Essayer d'abord d'utiliser le nouveau service Prisma
    try {
      const { getAllQuiz: getAllQuizFromService } = await import('./quiz-service');
      const quizzes = await getAllQuizFromService();
      // Toujours retourner les quiz de Prisma s'ils existent, même si le tableau est vide
      // (cela signifie qu'il n'y a vraiment pas de quiz, pas un problème de connexion)
      if (quizzes) {
        log(`✅ ${quizzes.length} quiz récupérés depuis Prisma (nouveau backend)`);
        return quizzes;
      }
      log('⚠️ Prisma retourne null, fallback vers WordPress');
    } catch (prismaError: any) {
      log('⚠️ Prisma non disponible, utilisation WordPress (fallback)');
      log('   Erreur:', prismaError?.message || prismaError);
    }

    // ⚠️ IMPORTANT: Ne pas utiliser WordPress pendant le build
    // Pendant le build (process.env.NEXT_PHASE === 'phase-production-build'),
    // on retourne un tableau vide plutôt que d'essayer de se connecter à WordPress
    // Cela évite les erreurs de connexion pendant le build
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY;
    
    if (isBuildTime) {
      log('⚠️ Build détecté: retour d\'un tableau vide (pas de fallback WordPress)');
      return [];
    }

    // Fallback vers WordPress uniquement en développement ou runtime
    // ⚠️ IMPORTANT (DEV) :
    // On désactive temporairement unstable_cache pour éviter qu'un ancien appel en échec
    // (timeout, WordPress éteint, etc.) ne mette en cache un tableau vide pendant 1h.
    // Cela permet de toujours récupérer la liste réelle des quiz pendant la phase de
    // configuration locale.
    //
    // Pour la production, vous pouvez réactiver le cache si nécessaire.
    log('🔄 Fallback vers WordPress...');
    const wordpressQuizzes = await _getAllQuizUncached();
    log(`📊 ${wordpressQuizzes.length} quiz récupérés depuis WordPress`);
    return wordpressQuizzes;
  } catch (error) {
    logError('Erreur getAllQuiz:', error);
    return [];
  }
}

/**
 * Récupère un quiz spécifique par son slug (Tutor LMS)
 * Version non cachée pour utilisation interne
 */
async function _getQuizBySlugUncached(slug: string): Promise<Quiz | null> {
  if (!WORDPRESS_API_URL) return null;
  try {
    let tutorQuiz: any = null;
    try {
      const directResponse = await tutorApiClient.get(`/quiz/${slug}`);
      if (directResponse.data) {
        tutorQuiz = directResponse.data;
      }
    } catch (directError: any) {
      // Si la route directe n'existe pas, récupérer tous les quiz
      log('Route directe non disponible, récupération de tous les quiz...');
      const allQuizsResponse = await tutorApiClient.get('/quizzes', {
        params: {
          per_page: 100,
        },
      });

      // Gérer la structure de réponse {code, message, data} ou directement un tableau
      const quizzesData = allQuizsResponse.data?.data || allQuizsResponse.data || [];
      
      if (!Array.isArray(quizzesData)) {
        logError('Format de réponse inattendu:', allQuizsResponse.data);
        return null;
      }

      tutorQuiz = quizzesData.find((q: any) => 
        q.post_name === slug || q.slug === slug
      );
    }

    if (!tutorQuiz) {
      return null;
    }

    // Récupérer les questions
    const quizId = tutorQuiz.ID || tutorQuiz.id;
    let questions: Question[] = [];
    try {
      log(`🔍 Récupération des questions pour le quiz ID: ${quizId}`);
      
      // Essayer d'abord la route simple /questions?quiz_id={id} (la plus fiable)
      let questionsResponse;
      try {
        log(`📡 Tentative avec route simple /questions?quiz_id=${quizId}`);
        questionsResponse = await tutorApiClient.get('/questions', {
          params: { quiz_id: quizId }
        });
        log(`✅ Route simple fonctionne !`);
      } catch (error: any) {
        // Si la route simple échoue, essayer les autres routes
        if (error.response?.status === 404) {
          log(`⚠️ Route simple non trouvée (404), tentative avec autres routes...`);
          try {
            // Essayer de récupérer le quiz avec les questions incluses
            const quizWithQuestions = await tutorApiClient.get(`/quiz/${quizId}`, {
              params: { include_questions: 'true' }
            });
            
            // Si le quiz contient les questions
            if (quizWithQuestions.data?.questions && Array.isArray(quizWithQuestions.data.questions)) {
              log(`✅ Questions récupérées via quiz avec include_questions`);
              questionsResponse = { data: { data: quizWithQuestions.data.questions } };
            } else {
              throw new Error('Questions non incluses dans la réponse');
            }
          } catch (error2: any) {
            // Essayer les autres routes
            try {
              questionsResponse = await tutorApiClient.get(`/quiz/${quizId}/questions`);
            } catch (error3: any) {
              if (error3.response?.status === 404) {
                try {
                  questionsResponse = await tutorApiClient.get('/quiz-questions', {
                    params: { quiz_id: quizId }
                  });
                } catch (altError: any) {
                  throw error; // Relancer l'erreur originale
                }
              } else {
                throw error3;
              }
            }
          }
        } else {
          throw error;
        }
      }
      
      log('📊 Structure réponse questions:', {
        hasData: !!questionsResponse.data,
        hasDataData: !!questionsResponse.data?.data,
        isArray: Array.isArray(questionsResponse.data),
        isDataArray: Array.isArray(questionsResponse.data?.data),
        keys: questionsResponse.data ? Object.keys(questionsResponse.data) : [],
      });
      
      // WordPress REST API retourne directement le tableau dans response.data
      // Mais vérifier aussi si c'est enveloppé dans un objet
      let questionsData: any[] = [];
      
      if (questionsResponse.data) {
        // Si c'est un objet avec code/message/data (format personnalisé du plugin)
        if (questionsResponse.data.code && questionsResponse.data.data) {
          questionsData = Array.isArray(questionsResponse.data.data) ? questionsResponse.data.data : [];
        }
        // Si c'est directement un tableau (cas normal pour WP_REST_Response)
        else if (Array.isArray(questionsResponse.data)) {
          questionsData = questionsResponse.data;
        }
        // Si c'est un objet avec une propriété data qui est un tableau
        else if (questionsResponse.data.data && Array.isArray(questionsResponse.data.data)) {
          questionsData = questionsResponse.data.data;
        }
        // Si c'est un objet avec une propriété questions (depuis quiz avec include_questions)
        else if (questionsResponse.data.questions && Array.isArray(questionsResponse.data.questions)) {
          questionsData = questionsResponse.data.questions;
        }
        // Si c'est un objet avec une seule propriété qui est un tableau
        else if (typeof questionsResponse.data === 'object') {
          const keys = Object.keys(questionsResponse.data);
          if (keys.length === 1 && Array.isArray(questionsResponse.data[keys[0]])) {
            questionsData = questionsResponse.data[keys[0]];
          }
        }
      }
      
      log(`✅ ${questionsData.length} questions brutes récupérées`);
      if (questionsData.length > 0) {
        log('  📋 Première question brute (complète):', JSON.stringify(questionsData[0], null, 2));
        log('  📋 Clés de la première question:', Object.keys(questionsData[0]));
      }
      questions = questionsData.map(normalizeTutorQuestion);
      log(`✅ ${questions.length} questions normalisées`);
      
      // Vérifier si les questions ont un texte
      const questionsWithText = questions.filter(q => q.texte_question && q.texte_question.trim() !== '');
      log(`  📊 Questions avec texte: ${questionsWithText.length} / ${questions.length}`);
      
      if (questions.length === 0) {
        logWarn(`⚠️ Aucune question trouvée pour le quiz ${quizId}`);
      }
    } catch (error: any) {
      logError(`❌ Erreur récupération questions pour quiz ${quizId}:`, error.message || error);
      if (error.response) {
        logError('   Status:', error.response.status);
        logError('   Data:', error.response.data);
      }
    }

    // Récupérer l'image featured
    let featuredMediaUrl = undefined;
    const featuredMediaId = tutorQuiz.featured_image_id || tutorQuiz.featured_media;
    if (featuredMediaId) {
      try {
        const mediaResponse = await axios.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/media/${featuredMediaId}`
        );
        featuredMediaUrl = mediaResponse.data.source_url;
      } catch (error) {
        logError(`Erreur récupération média:`, error);
      }
    }

    const normalizedQuiz = normalizeTutorQuiz(tutorQuiz, questions);
    if (featuredMediaUrl) {
      normalizedQuiz.featured_media_url = featuredMediaUrl;
    }

    return normalizedQuiz;
  } catch (error) {
    logError(`Erreur récupération quiz ${slug}:`, error);
    return null;
  }
}

// Version avec cache (uniquement pour Server Components)
// Désactivation temporaire du cache en dev pour éviter les problèmes
// TODO: Migrer vers quiz-service.ts pour utiliser Prisma
export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  try {
    // Essayer d'abord d'utiliser le nouveau service Prisma
    try {
      const { getQuizBySlug: getQuizBySlugFromService } = await import('./quiz-service');
      const quiz = await getQuizBySlugFromService(slug);
      if (quiz) {
        log(`✅ Quiz ${slug} récupéré depuis Prisma (nouveau backend)`);
        return quiz;
      }
    } catch (prismaError) {
      log('⚠️ Prisma non disponible, utilisation WordPress (fallback)');
    }

    // Fallback vers WordPress si Prisma n'est pas configuré
    if (!IS_PRODUCTION) {
      return _getQuizBySlugUncached(slug);
    }
    return unstable_cache(
      async () => _getQuizBySlugUncached(slug),
      [`quiz-${slug}`],
      {
        revalidate: 3600, // Cache pendant 1 heure
        tags: ['quizzes', `quiz-${slug}`],
      }
    )();
  } catch (error) {
    // Si unstable_cache échoue (composant client), utiliser la version non cachée
    logError('Erreur avec unstable_cache, utilisation version non cachée:', error);
    return _getQuizBySlugUncached(slug);
  }
}

/**
 * Récupère les quiz d'une catégorie spécifique
 */
export async function getQuizByCategory(categorySlug: string): Promise<Quiz[]> {
  try {
    // D'abord, récupérer l'ID de la catégorie
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

    // Ensuite, récupérer tous les quiz et filtrer par catégorie
    const response = await tutorApiClient.get('/quizzes', {
      params: {
        per_page: 100,
      },
    });

    // Gérer la structure de réponse {code, message, data} ou directement un tableau
    const quizzesData = response.data?.data || response.data || [];
    
    if (!Array.isArray(quizzesData)) {
      logError('Format de réponse inattendu:', response.data);
      return [];
    }

    // Filtrer par catégorie (les quiz doivent avoir cette catégorie)
    const filteredQuizs = quizzesData.filter((quiz: any) => {
      // Vérifier si le quiz a cette catégorie
      // Note: Vous devrez peut-être adapter cette logique selon votre structure
      return true; // Pour l'instant, on retourne tous les quiz
    });

    // Pour chaque quiz, récupérer les questions
    const quizs = await Promise.all(
      filteredQuizs.map(async (tutorQuiz: any) => {
        let questions: Question[] = [];
        
        try {
          const questionsResponse = await tutorApiClient.get(`/quiz/${tutorQuiz.ID || tutorQuiz.id}/questions`);
          // Gérer la structure de réponse {code, message, data} ou directement un tableau
          const questionsData = questionsResponse.data?.data || questionsResponse.data || [];
          questions = Array.isArray(questionsData) ? questionsData.map(normalizeTutorQuestion) : [];
        } catch (error) {
          logError(`Erreur récupération questions:`, error);
        }

        return normalizeTutorQuiz(tutorQuiz, questions);
      })
    );

    return quizs;
  } catch (error) {
    logError(`Erreur récupération quiz catégorie ${categorySlug}:`, error);
    return [];
  }
}

/**
 * Récupère toutes les catégories (version non cachée)
 * Exportée pour utilisation dans les API routes
 */
export async function _getAllCategoriesUncached(): Promise<Category[]> {
  if (!WORDPRESS_API_URL) return [];
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
    logError('Erreur récupération catégories:', error);
    return [];
  }
}

// Version avec cache (uniquement pour Server Components)
// Pour les composants client, utilisez /api/categories
export async function getAllCategories(): Promise<Category[]> {
  try {
    return unstable_cache(
      async () => _getAllCategoriesUncached(),
      ['all-categories'],
      {
        revalidate: 3600, // Cache pendant 1 heure
        tags: ['categories'],
      }
    )();
  } catch (error) {
    // Si unstable_cache échoue (composant client), utiliser la version non cachée
    logError('Erreur avec unstable_cache, utilisation version non cachée:', error);
    return _getAllCategoriesUncached();
  }
}

/**
 * Récupère les statistiques globales (version non cachée)
 */
async function _getStatsUncached(): Promise<Stats> {
  try {
    // Essayer d'abord d'utiliser Prisma
    try {
      const { prisma } = await import('./db');
      const { PUBLISHED_QUIZ_WHERE } = await import('./quiz-service');

      // Comptages légers (évite un 2e getAllQuiz() en parallèle avec la home → pool saturé)
      const [totalQuiz, totalQuestions, moduleCount] = await prisma.$transaction([
        prisma.quiz.count({ where: PUBLISHED_QUIZ_WHERE }),
        prisma.question.count({
          where: { quiz: PUBLISHED_QUIZ_WHERE },
        }),
        prisma.module.count({
          where: {
            course: {
              status: 'published',
            },
          },
        }),
      ]);

      log(
        `✅ Stats depuis Prisma: ${totalQuiz} quiz publiés, ${totalQuestions} questions, ${moduleCount} modules`
      );

      return {
        total_quiz: totalQuiz,
        total_questions: totalQuestions,
        total_categories: moduleCount,
        quiz_par_categorie: {},
      };
    } catch (prismaError) {
      log('⚠️ Prisma non disponible pour stats, utilisation WordPress');
    }

    // Fallback vers WordPress
    const quizs = await _getAllQuizUncached();
    const categories = await _getAllCategoriesUncached();

    // Compter les quiz par catégorie
    const quizParCategorie: Record<string, number> = {};
    categories.forEach((cat) => {
      quizParCategorie[cat.slug] = cat.count;
    });

    // Compter le total de questions (approximatif via les quiz)
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
    logError('Erreur récupération statistiques:', error);
    return {
      total_quiz: 0,
      total_questions: 0,
      total_categories: 0,
      quiz_par_categorie: {},
    };
  }
}

// Version avec cache (uniquement pour Server Components)
export async function getStats(): Promise<Stats> {
  try {
    return unstable_cache(
      async () => _getStatsUncached(),
      ['stats'],
      {
        revalidate: 3600, // Cache pendant 1 heure
        tags: ['stats', 'quizzes', 'categories'],
      }
    )();
  } catch (error) {
    // Si unstable_cache échoue (composant client), utiliser la version non cachée
    logError('Erreur avec unstable_cache, utilisation version non cachée:', error);
    return _getStatsUncached();
  }
}

/**
 * Récupère une question spécifique (non utilisé avec Tutor LMS, questions incluses dans le quiz)
 */
export async function getQuestionById(id: number): Promise<Question | null> {
  // Avec Tutor LMS, les questions sont récupérées avec le quiz
  // Cette fonction est conservée pour compatibilité
  logWarn('getQuestionById: Les questions sont incluses dans le quiz avec Tutor LMS');
  return null;
}

/**
 * Récupère tous les slugs de quiz pour la génération statique
 * TODO: Migrer vers quiz-service.ts pour utiliser Prisma
 */
export async function getAllQuizSlugs(): Promise<string[]> {
  try {
    // Essayer d'abord d'utiliser le nouveau service Prisma
    try {
      const { getAllQuizSlugs: getAllQuizSlugsFromService } = await import('./quiz-service');
      const slugs = await getAllQuizSlugsFromService();
      if (slugs.length > 0) {
        log(`✅ getAllQuizSlugs: ${slugs.length} slugs récupérés depuis Prisma`);
        return slugs;
      }
    } catch (prismaError) {
      log('⚠️ Prisma non disponible, utilisation WordPress (fallback)');
    }

    if (!WORDPRESS_API_URL) return [];
    const response = await tutorApiClient.get('/quizzes', {
      params: {
        per_page: 100,
      },
    });

    const quizzesData = response.data?.data || response.data || [];
    if (!Array.isArray(quizzesData)) {
      logError('❌ getAllQuizSlugs: Format de réponse inattendu');
      return [];
    }
    
    const slugs = quizzesData
      .map((quiz: any) => quiz.post_name || quiz.slug || '')
      .filter((slug: string) => slug !== ''); // Filtrer les slugs vides
    
    log(`✅ getAllQuizSlugs: ${slugs.length} slugs récupérés depuis WordPress`);
    if (slugs.length > 0) {
      log(`  Premiers slugs: ${slugs.slice(0, 5).join(', ')}...`);
    }
    
    return slugs;
  } catch (error) {
    logError('Erreur récupération slugs:', error);
    return [];
  }
}


