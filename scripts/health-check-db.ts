import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({ log: ['error'] });
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('DB health: OK');
    process.exitCode = 0;
  } catch (error) {
    console.error('DB health: FAIL');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

