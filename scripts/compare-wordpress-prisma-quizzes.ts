/**
 * Script pour comparer les quiz entre WordPress et Prisma
 * Affiche les quiz présents dans WordPress mais absents de Prisma, et vice versa
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

// Configuration WordPress
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://localhost/test2/wp-json';
const TUTOR_API_URL = `${WORDPRESS_API_URL}/tutor/v1`;

console.log('🔧 Configuration:');
console.log(`   WORDPRESS_API_URL: ${WORDPRESS_API_URL}`);
console.log(`   TUTOR_API_URL: ${TUTOR_API_URL}`);
console.log('');

// Client API pour Tutor LMS
const tutorApiClient = axios.create({
  baseURL: TUTOR_API_URL,
  timeout: 30000,
});

interface WordPressQuiz {
  id: number;
  post_title: string;
  post_name: string;
  slug?: string;
}

interface PrismaQuiz {
  id: string;
  title: string;
  slug: string;
}

async function getWordPressQuizzes(): Promise<WordPressQuiz[]> {
  try {
    console.log('📡 Récupération des quiz depuis WordPress...');
    
    // Essayer plusieurs endpoints
    let quizzesData: any[] = [];
    
    // Méthode 1: Tutor API /quizzes
    try {
      const response = await tutorApiClient.get('/quizzes', {
        params: {
          per_page: 100,
        },
      });

      if (response.data) {
        if (response.data.code && response.data.data) {
          quizzesData = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          quizzesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          quizzesData = response.data.data;
        }
      }
    } catch (error1: any) {
      console.log(`   ⚠️  Endpoint /quizzes non disponible: ${error1.message}`);
      
      // Méthode 2: WordPress REST API /tutor_quiz
      try {
        const wpApiClient = axios.create({
          baseURL: `${WORDPRESS_API_URL}/wp/v2`,
          timeout: 30000,
        });
        
        const response2 = await wpApiClient.get('/tutor_quiz', {
          params: {
            per_page: 100,
            status: 'publish',
          },
        });
        
        if (Array.isArray(response2.data)) {
          quizzesData = response2.data;
        }
      } catch (error2: any) {
        console.log(`   ⚠️  Endpoint /tutor_quiz non disponible: ${error2.message}`);
        throw new Error('Aucun endpoint WordPress disponible');
      }
    }

    const quizzes = quizzesData.map((quiz: any) => ({
      id: quiz.ID || quiz.id,
      post_title: quiz.post_title || quiz.title?.rendered || quiz.title,
      post_name: quiz.post_name || quiz.slug,
      slug: quiz.post_name || quiz.slug,
    }));

    console.log(`✅ ${quizzes.length} quiz récupérés depuis WordPress`);
    return quizzes;
  } catch (error: any) {
    console.error('❌ Erreur récupération quiz WordPress:', error.message);
    console.error('   Vérifiez que WordPress est accessible et que l\'API Tutor LMS est activée');
    return [];
  }
}

async function getPrismaQuizzes(): Promise<PrismaQuiz[]> {
  try {
    console.log('📡 Récupération des quiz depuis Prisma...');
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ ${quizzes.length} quiz récupérés depuis Prisma`);
    return quizzes;
  } catch (error: any) {
    console.error('❌ Erreur récupération quiz Prisma:', error.message);
    return [];
  }
}

function compareQuizzes(
  wpQuizzes: WordPressQuiz[],
  prismaQuizzes: PrismaQuiz[]
) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPARAISON DES QUIZ');
  console.log('='.repeat(80));

  // Créer des maps pour faciliter la recherche
  const wpQuizzesBySlug = new Map<string, WordPressQuiz>();
  const wpQuizzesByTitle = new Map<string, WordPressQuiz>();
  
  wpQuizzes.forEach((quiz) => {
    const slug = quiz.slug || quiz.post_name;
    if (slug) {
      wpQuizzesBySlug.set(slug.toLowerCase(), quiz);
    }
    if (quiz.post_title) {
      wpQuizzesByTitle.set(quiz.post_title.toLowerCase(), quiz);
    }
  });

  const prismaQuizzesBySlug = new Map<string, PrismaQuiz>();
  const prismaQuizzesByTitle = new Map<string, PrismaQuiz>();
  
  prismaQuizzes.forEach((quiz) => {
    prismaQuizzesBySlug.set(quiz.slug.toLowerCase(), quiz);
    prismaQuizzesByTitle.set(quiz.title.toLowerCase(), quiz);
  });

  // Quiz présents dans WordPress mais absents de Prisma
  const missingInPrisma: WordPressQuiz[] = [];
  wpQuizzes.forEach((wpQuiz) => {
    const slug = (wpQuiz.slug || wpQuiz.post_name || '').toLowerCase();
    const title = (wpQuiz.post_title || '').toLowerCase();
    
    const foundBySlug = slug && prismaQuizzesBySlug.has(slug);
    const foundByTitle = title && prismaQuizzesByTitle.has(title);
    
    if (!foundBySlug && !foundByTitle) {
      missingInPrisma.push(wpQuiz);
    }
  });

  // Quiz présents dans Prisma mais absents de WordPress
  const missingInWordPress: PrismaQuiz[] = [];
  prismaQuizzes.forEach((prismaQuiz) => {
    const slug = prismaQuiz.slug.toLowerCase();
    const title = prismaQuiz.title.toLowerCase();
    
    const foundBySlug = wpQuizzesBySlug.has(slug);
    const foundByTitle = wpQuizzesByTitle.has(title);
    
    if (!foundBySlug && !foundByTitle) {
      missingInWordPress.push(prismaQuiz);
    }
  });

  // Quiz présents dans les deux (par slug)
  const commonBySlug: Array<{ wp: WordPressQuiz; prisma: PrismaQuiz }> = [];
  wpQuizzes.forEach((wpQuiz) => {
    const slug = (wpQuiz.slug || wpQuiz.post_name || '').toLowerCase();
    if (slug && prismaQuizzesBySlug.has(slug)) {
      commonBySlug.push({
        wp: wpQuiz,
        prisma: prismaQuizzesBySlug.get(slug)!,
      });
    }
  });

  // Affichage des résultats
  console.log(`\n📈 STATISTIQUES:`);
  console.log(`   WordPress: ${wpQuizzes.length} quiz`);
  console.log(`   Prisma: ${prismaQuizzes.length} quiz`);
  console.log(`   Communs (par slug): ${commonBySlug.length} quiz`);

  if (missingInPrisma.length > 0) {
    console.log(`\n⚠️  QUIZ PRÉSENTS DANS WORDPRESS MAIS ABSENTS DE PRISMA (${missingInPrisma.length}):`);
    missingInPrisma.slice(0, 20).forEach((quiz, index) => {
      console.log(`   ${index + 1}. [ID: ${quiz.id}] "${quiz.post_title}" (slug: ${quiz.slug || quiz.post_name})`);
    });
    if (missingInPrisma.length > 20) {
      console.log(`   ... et ${missingInPrisma.length - 20} autres`);
    }
  } else {
    console.log(`\n✅ Tous les quiz WordPress sont présents dans Prisma`);
  }

  if (missingInWordPress.length > 0) {
    console.log(`\n⚠️  QUIZ PRÉSENTS DANS PRISMA MAIS ABSENTS DE WORDPRESS (${missingInWordPress.length}):`);
    missingInWordPress.slice(0, 20).forEach((quiz, index) => {
      console.log(`   ${index + 1}. [ID: ${quiz.id}] "${quiz.title}" (slug: ${quiz.slug})`);
    });
    if (missingInWordPress.length > 20) {
      console.log(`   ... et ${missingInWordPress.length - 20} autres`);
    }
  } else {
    console.log(`\n✅ Tous les quiz Prisma sont présents dans WordPress`);
  }

  // Détails des quiz communs (pour vérifier les différences de titre)
  if (commonBySlug.length > 0) {
    const titleMismatches: Array<{ wp: WordPressQuiz; prisma: PrismaQuiz }> = [];
    commonBySlug.forEach(({ wp, prisma }) => {
      const wpTitle = (wp.post_title || '').toLowerCase().trim();
      const prismaTitle = (prisma.title || '').toLowerCase().trim();
      if (wpTitle !== prismaTitle) {
        titleMismatches.push({ wp, prisma });
      }
    });

    if (titleMismatches.length > 0) {
      console.log(`\n⚠️  QUIZ AVEC SLUG IDENTIQUE MAIS TITRES DIFFÉRENTS (${titleMismatches.length}):`);
      titleMismatches.slice(0, 10).forEach(({ wp, prisma }, index) => {
        console.log(`   ${index + 1}. Slug: ${wp.slug || wp.post_name}`);
        console.log(`      WordPress: "${wp.post_title}"`);
        console.log(`      Prisma: "${prisma.title}"`);
      });
      if (titleMismatches.length > 10) {
        console.log(`   ... et ${titleMismatches.length - 10} autres`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  try {
    console.log('🚀 Démarrage de la comparaison WordPress vs Prisma...\n');

    const wpQuizzes = await getWordPressQuizzes();
    const prismaQuizzes = await getPrismaQuizzes();

    compareQuizzes(wpQuizzes, prismaQuizzes);

    console.log('\n✅ Comparaison terminée');
  } catch (error: any) {
    console.error('❌ Erreur lors de la comparaison:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
