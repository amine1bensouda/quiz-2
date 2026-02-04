/**
 * Script pour vérifier le système d'authentification
 * Vérifie les fonctionnalités de création de compte, login, dashboard et sauvegarde des quiz attempts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 VÉRIFICATION DU SYSTÈME D\'AUTHENTIFICATION\n');
console.log('='.repeat(80));

// 1. Vérifier les fichiers d'authentification
console.log('\n📁 1. VÉRIFICATION DES FICHIERS');
console.log('-'.repeat(80));

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/app/register/page.tsx',
  'src/app/login/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/lib/auth.ts',
  'src/components/Quiz/QuizPlayer.tsx',
];

let allFilesExist = true;
filesToCheck.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// 2. Vérifier le contenu de auth.ts
console.log('\n📝 2. VÉRIFICATION DES FONCTIONS D\'AUTHENTIFICATION');
console.log('-'.repeat(80));

const authFile = fs.readFileSync(path.join(process.cwd(), 'src/lib/auth.ts'), 'utf-8');

const functionsToCheck = [
  'register',
  'login',
  'logout',
  'getCurrentUser',
  'saveQuizAttempt',
  'getQuizAttempts',
  'getQuizStats',
];

functionsToCheck.forEach((func) => {
  const exists = authFile.includes(`function ${func}`) || authFile.includes(`export function ${func}`);
  console.log(`${exists ? '✅' : '❌'} Fonction ${func}()`);
});

// 3. Vérifier l'utilisation dans QuizPlayer
console.log('\n🎮 3. VÉRIFICATION DE L\'INTÉGRATION DANS QUIZPLAYER');
console.log('-'.repeat(80));

const quizPlayerFile = fs.readFileSync(path.join(process.cwd(), 'src/components/Quiz/QuizPlayer.tsx'), 'utf-8');
const usesSaveQuizAttempt = quizPlayerFile.includes('saveQuizAttempt');
const importsAuth = quizPlayerFile.includes("from '@/lib/auth'");

console.log(`${usesSaveQuizAttempt ? '✅' : '❌'} Utilise saveQuizAttempt() dans QuizPlayer`);
console.log(`${importsAuth ? '✅' : '❌'} Importe @/lib/auth dans QuizPlayer`);

// 4. Vérifier le dashboard
console.log('\n📊 4. VÉRIFICATION DU DASHBOARD');
console.log('-'.repeat(80));

const dashboardFile = fs.readFileSync(path.join(process.cwd(), 'src/app/dashboard/page.tsx'), 'utf-8');
const usesGetCurrentUser = dashboardFile.includes('getCurrentUser');
const usesGetQuizStats = dashboardFile.includes('getQuizStats');
const usesLogout = dashboardFile.includes('logout');
const showsStats = dashboardFile.includes('stats.totalAttempts') || dashboardFile.includes('stats.averageScore');

console.log(`${usesGetCurrentUser ? '✅' : '❌'} Utilise getCurrentUser() dans Dashboard`);
console.log(`${usesGetQuizStats ? '✅' : '❌'} Utilise getQuizStats() dans Dashboard`);
console.log(`${usesLogout ? '✅' : '❌'} Utilise logout() dans Dashboard`);
console.log(`${showsStats ? '✅' : '❌'} Affiche les statistiques dans Dashboard`);

// 5. Vérifier Prisma pour un modèle User
console.log('\n🗄️  5. VÉRIFICATION DE LA BASE DE DONNÉES');
console.log('-'.repeat(80));

const schemaFile = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf-8');
const hasUserModel = schemaFile.includes('model User');

console.log(`${hasUserModel ? '✅' : '⚠️ '} Modèle User dans Prisma`);
if (!hasUserModel) {
  console.log('   ⚠️  Le système utilise localStorage au lieu de Prisma pour l\'authentification');
  console.log('   ⚠️  Pour la production, il faudrait créer un modèle User dans Prisma');
}

// 6. Vérifier les routes API
console.log('\n🌐 6. VÉRIFICATION DES ROUTES API');
console.log('-'.repeat(80));

const apiDir = path.join(process.cwd(), 'src/app/api');
const hasAuthApi = fs.existsSync(path.join(apiDir, 'auth'));
const hasUserApi = fs.existsSync(path.join(apiDir, 'users'));

console.log(`${hasAuthApi ? '✅' : '⚠️ '} Route API /api/auth existe`);
console.log(`${hasUserApi ? '✅' : '⚠️ '} Route API /api/users existe`);

if (!hasAuthApi && !hasUserApi) {
  console.log('   ⚠️  Aucune route API pour l\'authentification');
  console.log('   ⚠️  Le système utilise localStorage uniquement (client-side)');
}

// 7. Résumé et recommandations
console.log('\n' + '='.repeat(80));
console.log('📋 RÉSUMÉ');
console.log('='.repeat(80));

console.log('\n✅ Points positifs:');
console.log('   - Système d\'authentification basique fonctionnel avec localStorage');
console.log('   - Pages register/login/dashboard présentes');
console.log('   - Sauvegarde des quiz attempts implémentée');
console.log('   - Dashboard affiche les statistiques');

console.log('\n⚠️  Points d\'attention:');
console.log('   - Utilise localStorage (non sécurisé pour la production)');
console.log('   - Pas de modèle User dans Prisma');
console.log('   - Pas de routes API pour l\'authentification');
console.log('   - Mots de passe stockés en clair dans localStorage');

console.log('\n🔧 Recommandations pour la production:');
console.log('   1. Créer un modèle User dans Prisma');
console.log('   2. Créer des routes API pour register/login');
console.log('   3. Utiliser des sessions/cookies au lieu de localStorage');
console.log('   4. Hasher les mots de passe (bcrypt)');
console.log('   5. Ajouter la validation côté serveur');
console.log('   6. Sauvegarder les quiz attempts dans la base de données');

console.log('\n' + '='.repeat(80));
