-- CreateEnum (user_role already exists from previous migration, skip if exists)
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'suspended', 'deleted');

-- Add status column (role already exists from previous migration)
ALTER TABLE "users" ADD COLUMN "status" "user_status" NOT NULL DEFAULT 'active';

-- Migrate data: is_active=false → suspended, deleted_at IS NOT NULL → deleted
UPDATE "users" SET "status" = 'deleted' WHERE "deleted_at" IS NOT NULL;
UPDATE "users" SET "status" = 'suspended' WHERE "is_active" = false AND "deleted_at" IS NULL;

-- Drop old columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at";
