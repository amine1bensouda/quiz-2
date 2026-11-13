-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "orderNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_orderNumber_key" ON "subscriptions"("orderNumber");
