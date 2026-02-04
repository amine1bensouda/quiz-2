import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function checkCount() {
  try {
    const count = await prisma.quiz.count();
    console.log(`📊 Nombre de quiz dans la base: ${count}`);
    
    if (count > 0) {
      const firstQuiz = await prisma.quiz.findFirst({
        select: { id: true, title: true, slug: true }
      });
      console.log(`📝 Premier quiz:`, firstQuiz);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCount();
