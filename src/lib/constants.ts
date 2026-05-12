// Site constants

export const SITE_NAME = 'Crack The Curve';
export const SITE_DESCRIPTION = 'Test your knowledge with our interactive mathematics quizzes';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://crackthecurve.com';

// Difficulty levels (Fundamental, Intermediate, Advanced + legacy for backward compatibility)
export const DIFFICULTY_LEVELS: Record<string, { label: string; color: string; icon: string }> = {
  Fundamental: { label: 'Fundamental', color: 'green', icon: '🟢' },
  Intermediate: { label: 'Intermediate', color: 'yellow', icon: '🟡' },
  Advanced: { label: 'Advanced', color: 'orange', icon: '🟠' },
  // Legacy : Easy/Facile → Fundamental, Medium/Moyen → Intermediate, Hard/Expert → Advanced
  Easy: { label: 'Fundamental', color: 'green', icon: '🟢' },
  Medium: { label: 'Intermediate', color: 'yellow', icon: '🟡' },
  Hard: { label: 'Advanced', color: 'orange', icon: '🟠' },
  Expert: { label: 'Advanced', color: 'red', icon: '🔴' },
  Facile: { label: 'Fundamental', color: 'green', icon: '🟢' },
  Moyen: { label: 'Intermediate', color: 'yellow', icon: '🟡' },
  Difficile: { label: 'Advanced', color: 'orange', icon: '🟠' },
};

// Default categories (display / seed labels)
export const DEFAULT_CATEGORIES = [
  'History',
  'Geography',
  'Science',
  'Sports',
  'General knowledge',
  'Literature',
  'Cinema',
  'Music',
] as const;

// AdSense configuration
export const ADSENSE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  adSlot: {
    display: '1234567890',
    inArticle: '1234567891',
    sidebar: '1234567892',
  },
} as const;

// ISR revalidation interval
export const REVALIDATE_TIME = parseInt(process.env.NEXT_REVALIDATE_TIME || '3600', 10);

