-- AlterTable: Add semesterId column and create unique constraint
-- First, add the column as nullable
ALTER TABLE "rapor_files" ADD COLUMN "semesterId" TEXT;

-- Get the first available semester ID (you may need to adjust this based on your data)
-- This is a safe default migration
DO $$
DECLARE
  first_semester_id TEXT;
BEGIN
  SELECT id INTO first_semester_id FROM "semesters" ORDER BY "tanggalMulai" ASC LIMIT 1;
  
  IF first_semester_id IS NOT NULL THEN
    UPDATE "rapor_files" SET "semesterId" = first_semester_id WHERE "semesterId" IS NULL;
  END IF;
END $$;

-- Now make it NOT NULL
ALTER TABLE "rapor_files" ALTER COLUMN "semesterId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "rapor_files" ADD CONSTRAINT "rapor_files_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create unique constraint
CREATE UNIQUE INDEX "rapor_files_studentId_semesterId_key" ON "rapor_files"("studentId", "semesterId");
