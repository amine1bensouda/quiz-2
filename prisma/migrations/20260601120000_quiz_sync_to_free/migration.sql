-- Sync premium -> site gratuit (the-school)
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "sync_publish_status" TEXT NOT NULL DEFAULT 'NOT_PUBLISHED';
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP(3);
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "free_quiz_id" TEXT;
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "last_sync_payload_hash" TEXT;

CREATE INDEX IF NOT EXISTS "quizzes_sync_publish_status_idx" ON "quizzes"("sync_publish_status");

CREATE TABLE IF NOT EXISTS "sync_logs" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'TO_FREE',
    "status" TEXT NOT NULL,
    "free_quiz_id" TEXT,
    "payload_hash" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sync_logs_quiz_id_created_at_idx" ON "sync_logs"("quiz_id", "created_at" DESC);

DO $$ BEGIN
  ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
