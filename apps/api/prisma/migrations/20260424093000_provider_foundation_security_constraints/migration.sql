-- Phase 07 provider foundation schema backfill.
-- The phase used db push during implementation; keep this migration idempotent so
-- databases that already received the push and fresh migration-based databases converge.

DO $$
BEGIN
  CREATE TYPE "provider" AS ENUM ('gemini', 'openai');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "generations"
  ADD COLUMN IF NOT EXISTS "provider" "provider" NOT NULL DEFAULT 'gemini',
  ADD COLUMN IF NOT EXISTS "provider_model" TEXT NOT NULL DEFAULT 'gemini-3-pro-image-preview',
  ADD COLUMN IF NOT EXISTS "provider_trace" JSONB,
  ADD COLUMN IF NOT EXISTS "openai_request_id" TEXT,
  ADD COLUMN IF NOT EXISTS "openai_response_id" TEXT,
  ADD COLUMN IF NOT EXISTS "openai_image_call_id" TEXT,
  ADD COLUMN IF NOT EXISTS "openai_revised_prompt" TEXT;

ALTER TABLE "api_keys"
  ADD COLUMN IF NOT EXISTS "provider" "provider" NOT NULL DEFAULT 'gemini';

CREATE INDEX IF NOT EXISTS "api_keys_provider_is_active_idx"
  ON "api_keys"("provider", "is_active");

WITH ranked_active_keys AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "provider"
      ORDER BY "created_at" DESC, "id" DESC
    ) AS active_rank
  FROM "api_keys"
  WHERE "is_active" = true
)
UPDATE "api_keys"
SET "is_active" = false
FROM ranked_active_keys
WHERE "api_keys"."id" = ranked_active_keys."id"
  AND ranked_active_keys.active_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_one_active_per_provider"
  ON "api_keys"("provider")
  WHERE "is_active" = true;
