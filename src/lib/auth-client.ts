/**
 * Client-side authentication functions
 * Utilise les routes API au lieu de localStorage
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface QuizAttempt {
  quizId: string;
  quizTitle: string;
  quizSlug: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
  timeSpent: number;
}

// Cache pour l'utilisateur actuel (évite les appels API répétés)
let currentUserCache: User | null = null;

/**
 * Récupère l'utilisateur actuel depuis l'API
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/users/me', {
      credentials: 'include',
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        currentUserCache = data.user;
        return data.user;
      }
    }

    // 401 est normal si l'utilisateur n'est pas connecté, ne pas logger comme erreur
    if (response.status !== 401) {
      console.warn('Unexpected response from /api/users/me:', response.status);
    }

    currentUserCache = null;
    return null;
  } catch (error) {
    // Ne logger que les vraies erreurs réseau, pas les 401 normales
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error getting current user:', error);
    }
    currentUserCache = null;
    return null;
  }
}

/**
 * Invalide le cache utilisateur
 */
export function clearUserCache(): void {
  currentUserCache = null;
}

/**
 * Enregistre un nouvel utilisateur
 */
export async function register(email: string, password: string, name: string): Promise<User> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    let errorMessage = 'Registration failed';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
        
        // Messages d'erreur plus clairs pour l'utilisateur
        if (errorMessage.includes('Database connection')) {
          errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
        } else if (errorMessage.includes('already registered')) {
          errorMessage = 'This email is already registered. Sign in or use another email.';
        }
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
    } catch (e) {
      // Si la réponse n'est pas du JSON valide, utiliser le message par défaut
      errorMessage = `Registration failed (${response.status} ${response.statusText})`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  currentUserCache = data.user;
  return data.user;
}

/**
 * Connecte un utilisateur
 */
export async function login(email: string, password: string): Promise<User> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = 'Login failed';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
        
        // Messages d'erreur plus clairs pour l'utilisateur
        if (errorMessage.includes('Database connection')) {
          errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
        } else if (errorMessage.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password.';
        }
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
    } catch (e) {
      // Si la réponse n'est pas du JSON valide, utiliser le message par défaut
      errorMessage = `Login failed (${response.status} ${response.statusText})`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  currentUserCache = data.user;
  return data.user;
}

/**
 * Déconnecte l'utilisateur
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error logging out:', error);
  } finally {
    currentUserCache = null;
  }
}

/**
 * Sauvegarde un quiz attempt
 */
export async function saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
  try {
    // Convertir quizId de number à string si nécessaire
    const quizId = typeof attempt.quizId === 'number' 
      ? String(attempt.quizId) 
      : attempt.quizId;

    const response = await fetch('/api/quiz-attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        quizId,
        score: attempt.score,
        percentage: attempt.percentage,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        timeSpent: attempt.timeSpent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error saving quiz attempt:', error);
    }
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
  }
}

/**
 * Récupère tous les quiz attempts de l'utilisateur
 */
export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  try {
    const response = await fetch('/api/quiz-attempts', {
      credentials: 'include',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    // Convertir au format attendu par le frontend
    return data.attempts.map((attempt: any) => ({
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      quizSlug: attempt.quiz.slug,
      score: attempt.score,
      percentage: attempt.percentage,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
    }));
  } catch (error) {
    console.error('Error getting quiz attempts:', error);
    return [];
  }
}

/**
 * Récupère les statistiques des quiz pour l'utilisateur
 */
export async function getQuizStats() {
  const attempts = await getQuizAttempts();
  const totalAttempts = attempts.length;
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0;
  const passedQuizzes = attempts.filter(a => a.percentage >= 70).length;
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);

  return {
    totalAttempts,
    averageScore,
    passedQuizzes,
    totalTimeSpent,
    attempts,
  };
}
