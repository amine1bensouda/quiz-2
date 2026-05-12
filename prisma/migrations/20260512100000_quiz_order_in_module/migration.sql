-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "quizzes_moduleId_order_idx" ON "quizzes"("moduleId", "order");
