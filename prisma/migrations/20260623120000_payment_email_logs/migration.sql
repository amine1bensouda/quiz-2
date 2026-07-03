-- CreateTable
CREATE TABLE "payment_email_logs" (
    "id" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_email_logs_dedupe_key_key" ON "payment_email_logs"("dedupe_key");
