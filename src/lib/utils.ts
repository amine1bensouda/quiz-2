// Shared utilities

/** Human-readable duration from minutes */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
}

/** Percentage score */
export function calculatePercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

/** Thousands separator (US locale) */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/** URL slug from arbitrary text */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const DIFFICULTY_EN: Record<string, string> = {
  Fundamental: 'Fundamental',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
  Fondamental: 'Fundamental',
  Intermediaire: 'Intermediate',
  'Intermédiaire': 'Intermediate',
  Avancé: 'Advanced',
  Facile: 'Fundamental',
  Moyen: 'Intermediate',
  Difficile: 'Advanced',
  Expert: 'Advanced',
  Easy: 'Fundamental',
  Medium: 'Intermediate',
  Hard: 'Advanced',
};

/** True when difficulty is meaningful (hide empty / generic placeholders) */
export function shouldDisplayDifficulty(value: unknown): boolean {
  if (value == null) return false;
  const t = String(value).trim();
  if (!t) return false;
  const generic = new Set(['Moyen', 'Medium', 'Intermediate']);
  return !generic.has(t);
}

/** Normalize difficulty labels to English for UI */
export function difficultyToEnglish(value: string | undefined): string {
  if (!value || !value.trim()) return '';
  const trimmed = value.trim();
  return DIFFICULTY_EN[trimmed] ?? trimmed;
}

/** @deprecated Use difficultyToEnglish — kept for imports */
export const translateDifficulty = difficultyToEnglish;

const CATEGORY_EN: Record<string, string> = {
  'Examens mini chronométrés': 'Timed Mini Exams',
  'Examens mini': 'Mini Exams',
  Entraînement: 'Practice',
  'Examen complet': 'Full Exam',
  Histoire: 'History',
  Géographie: 'Geography',
  Science: 'Science',
  Sport: 'Sports',
  'Culture générale': 'General knowledge',
  Littérature: 'Literature',
  Cinéma: 'Cinema',
  Musique: 'Music',
};

/** Normalize category labels to English for UI */
export function categoryToEnglish(value: string | undefined): string {
  if (!value || !value.trim()) return '';
  const trimmed = value.trim();
  return CATEGORY_EN[trimmed] ?? trimmed;
}

/** @deprecated Use categoryToEnglish — kept for imports */
export const translateCategory = categoryToEnglish;

/** Long-form date in English */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/** Fisher–Yates shuffle */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * True when question stem should use HtmlWithMathRenderer (preserve underline, bold, links, etc.)
 * instead of MathRenderer, which strips all HTML tags.
 */
export function questionStemNeedsHtmlRenderer(html: string | undefined | null): boolean {
  if (!html || typeof html !== 'string') return false;
  if (html.includes('<img') || html.includes('data:image/')) return true;
  return /<\/?[a-z][a-z0-9]*\b/i.test(html);
}

/** Plain text from HTML */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/** Short plain-text preview from HTML (course cards, lists) */
export function excerptFromHtml(html: string, maxLength = 200): string {
  if (!html || typeof html !== 'string') return '';
  const noScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  const text = stripHtml(noScripts).replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > Math.floor(maxLength * 0.45) ? cut.slice(0, lastSpace) : cut;
  return `${safe.trim()}…`;
}

/** Detect serialized PHP blobs; return null to avoid rendering garbage */
export function cleanSerializedData(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  
  // Détecter le format PHP sérialisé (commence par a: ou s: ou O:)
  const serializedPattern = /^(a:\d+:\{|s:\d+:|O:\d+:|i:\d+|b:[01]|d:|N;)/;
  if (serializedPattern.test(text.trim())) {
    console.warn('⚠️ Serialized PHP data detected:', text.substring(0, 100));
    return null;
  }
  
  // Détecter si c'est principalement du code sérialisé (contient beaucoup de patterns sérialisés)
  const serializedMatches = text.match(/[a-z]:\d+:/g);
  if (serializedMatches && serializedMatches.length > 3) {
    console.warn('⚠️ Too many serialized patterns in text:', text.substring(0, 100));
    return null;
  }
  
  return text;
}

