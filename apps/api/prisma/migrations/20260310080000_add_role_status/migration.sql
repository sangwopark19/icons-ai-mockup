-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "user_status" AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role/status columns. Some deployed v2 databases never had these columns.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" NOT NULL DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "user_status" NOT NULL DEFAULT 'active';

-- Migrate legacy data if the old soft-delete/suspend columns exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'deleted_at'
  ) THEN
    EXECUTE 'UPDATE "users" SET "status" = ''deleted'' WHERE "deleted_at" IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
      EXECUTE 'UPDATE "users" SET "status" = ''suspended'' WHERE "is_active" = false AND "deleted_at" IS NULL';
    ELSE
      EXECUTE 'UPDATE "users" SET "status" = ''suspended'' WHERE "is_active" = false';
    END IF;
  END IF;
END $$;

-- Drop old columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at";
