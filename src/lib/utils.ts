// Fonctions utilitaires

/**
 * Formate une durée en minutes en format lisible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Calcule le pourcentage de score
 */
export function calculatePercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Génère un slug à partir d'un texte
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Formate une date en français
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Mélange un tableau (algorithme Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Délai en millisecondes
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extrait le texte d'un HTML (pour les excerpts)
 */
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

/**
 * Détecte et nettoie les données PHP sérialisées
 * Retourne null si c'est du code sérialisé (pour éviter de l'afficher)
 */
export function cleanSerializedData(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  
  // Détecter le format PHP sérialisé (commence par a: ou s: ou O:)
  const serializedPattern = /^(a:\d+:\{|s:\d+:|O:\d+:|i:\d+|b:[01]|d:|N;)/;
  if (serializedPattern.test(text.trim())) {
    console.warn('⚠️ Données PHP sérialisées détectées:', text.substring(0, 100));
    return null;
  }
  
  // Détecter si c'est principalement du code sérialisé (contient beaucoup de patterns sérialisés)
  const serializedMatches = text.match(/[a-z]:\d+:/g);
  if (serializedMatches && serializedMatches.length > 3) {
    console.warn('⚠️ Texte contient trop de patterns sérialisés:', text.substring(0, 100));
    return null;
  }
  
  return text;
}

