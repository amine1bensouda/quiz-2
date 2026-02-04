// Site constants

export const SITE_NAME = 'The School of Mathematics';
export const SITE_DESCRIPTION = 'Test your knowledge with our interactive mathematics quizzes';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://theschoolofmathematics.com';

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  Easy: { label: 'Easy', color: 'green', icon: '🟢' },
  Medium: { label: 'Medium', color: 'yellow', icon: '🟡' },
  Hard: { label: 'Hard', color: 'orange', icon: '🟠' },
  Expert: { label: 'Expert', color: 'red', icon: '🔴' },
} as const;

// Catégories par défaut
export const DEFAULT_CATEGORIES = [
  'Histoire',
  'Géographie',
  'Science',
  'Sport',
  'Culture générale',
  'Littérature',
  'Cinéma',
  'Musique',
] as const;

// Configuration AdSense
export const ADSENSE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  adSlot: {
    display: '1234567890',
    inArticle: '1234567891',
    sidebar: '1234567892',
  },
} as const;

// Temps de revalidation ISR
export const REVALIDATE_TIME = parseInt(process.env.NEXT_REVALIDATE_TIME || '3600', 10);

