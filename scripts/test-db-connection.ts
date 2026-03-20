/**
 * Script de test de connexion à la base de données PostgreSQL (Supabase)
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local explicitement
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie!');
    
    // Tester une requête simple
    const courseCount = await prisma.course.count();
    console.log(`📊 Nombre de cours dans la base: ${courseCount}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
