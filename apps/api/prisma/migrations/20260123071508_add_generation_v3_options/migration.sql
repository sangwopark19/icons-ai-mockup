-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "parent_generation_id" TEXT,
ADD COLUMN     "user_instructions" TEXT,
ADD COLUMN     "viewpoint_lock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "white_background" BOOLEAN NOT NULL DEFAULT false;
