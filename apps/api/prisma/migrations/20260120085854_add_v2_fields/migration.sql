-- AlterTable
ALTER TABLE "generations" ADD COLUMN     "style_reference_id" TEXT,
ADD COLUMN     "thought_signatures" JSONB,
ADD COLUMN     "user_instructions" TEXT;

-- CreateIndex
CREATE INDEX "generations_style_reference_id_idx" ON "generations"("style_reference_id");

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_style_reference_id_fkey" FOREIGN KEY ("style_reference_id") REFERENCES "generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
