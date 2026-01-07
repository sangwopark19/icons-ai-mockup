-- CreateEnum
CREATE TYPE "generation_mode" AS ENUM ('ip_change', 'sketch_to_real');

-- CreateEnum
CREATE TYPE "generation_status" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "image_type" AS ENUM ('source', 'character', 'texture', 'output', 'edited');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_characters" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "ip_character_id" TEXT,
    "source_image_id" TEXT,
    "mode" "generation_mode" NOT NULL,
    "status" "generation_status" NOT NULL DEFAULT 'pending',
    "prompt_data" JSONB NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_images" (
    "id" TEXT NOT NULL,
    "generation_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "type" "image_type" NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "has_transparency" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_history" (
    "id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "parent_history_id" TEXT,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upscaled_images" (
    "id" TEXT NOT NULL,
    "original_image_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "scale" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upscaled_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "projects_user_id_created_at_idx" ON "projects"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ip_characters_project_id_idx" ON "ip_characters"("project_id");

-- CreateIndex
CREATE INDEX "generations_project_id_created_at_idx" ON "generations"("project_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "generations_status_idx" ON "generations"("status");

-- CreateIndex
CREATE INDEX "generations_ip_character_id_idx" ON "generations"("ip_character_id");

-- CreateIndex
CREATE INDEX "generated_images_generation_id_idx" ON "generated_images"("generation_id");

-- CreateIndex
CREATE INDEX "generated_images_generation_id_is_selected_idx" ON "generated_images"("generation_id", "is_selected");

-- CreateIndex
CREATE INDEX "image_history_image_id_created_at_idx" ON "image_history"("image_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "image_history_parent_history_id_idx" ON "image_history"("parent_history_id");

-- CreateIndex
CREATE UNIQUE INDEX "upscaled_images_original_image_id_key" ON "upscaled_images"("original_image_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ip_characters" ADD CONSTRAINT "ip_characters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_ip_character_id_fkey" FOREIGN KEY ("ip_character_id") REFERENCES "ip_characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_source_image_id_fkey" FOREIGN KEY ("source_image_id") REFERENCES "generated_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_history" ADD CONSTRAINT "image_history_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "generated_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_history" ADD CONSTRAINT "image_history_parent_history_id_fkey" FOREIGN KEY ("parent_history_id") REFERENCES "image_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upscaled_images" ADD CONSTRAINT "upscaled_images_original_image_id_fkey" FOREIGN KEY ("original_image_id") REFERENCES "generated_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
