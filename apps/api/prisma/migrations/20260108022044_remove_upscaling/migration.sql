/*
  Warnings:

  - You are about to drop the `upscaled_images` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "upscaled_images" DROP CONSTRAINT "upscaled_images_original_image_id_fkey";

-- DropTable
DROP TABLE "upscaled_images";
