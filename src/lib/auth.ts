// Simple authentication system using localStorage
// In production, this should be replaced with a proper backend API

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface QuizAttempt {
  quizId: number;
  quizTitle: string;
  quizSlug: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
  timeSpent: number;
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Set current user
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// Logout
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('currentUser');
}

// Register new user
export function register(email: string, password: string, name: string): Promise<User> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser'));
      return;
    }

    // Check if user already exists
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      reject(new Error('Email already registered'));
      return;
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      createdAt: new Date().toISOString(),
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem(`user_${newUser.id}_password`, password); // In production, hash this!

    // Auto login
    setCurrentUser(newUser);
    resolve(newUser);
  });
}

// Login
export function login(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser'));
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      reject(new Error('Invalid email or password'));
      return;
    }

    const savedPassword = localStorage.getItem(`user_${user.id}_password`);
    if (savedPassword !== password) {
      reject(new Error('Invalid email or password'));
      return;
    }

    setCurrentUser(user);
    resolve(user);
  });
}

// Get all users (for demo purposes)
function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const usersStr = localStorage.getItem('users');
  if (!usersStr) return [];
  try {
    return JSON.parse(usersStr);
  } catch {
    return [];
  }
}

// Save quiz attempt
export function saveQuizAttempt(attempt: QuizAttempt): void {
  if (typeof window === 'undefined') return;
  const user = getCurrentUser();
  if (!user) return;

  const attempts = getQuizAttempts();
  attempts.push(attempt);
  localStorage.setItem(`quiz_attempts_${user.id}`, JSON.stringify(attempts));
}

// Get all quiz attempts for current user
export function getQuizAttempts(): QuizAttempt[] {
  if (typeof window === 'undefined') return [];
  const user = getCurrentUser();
  if (!user) return [];

  const attemptsStr = localStorage.getItem(`quiz_attempts_${user.id}`);
  if (!attemptsStr) return [];
  try {
    return JSON.parse(attemptsStr);
  } catch {
    return [];
  }
}

// Get quiz statistics for current user
export function getQuizStats() {
  const attempts = getQuizAttempts();
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






