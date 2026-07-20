-- CreateEnum
CREATE TYPE "RaporStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "rapor_files" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "RaporStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapor_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rapor_files" ADD CONSTRAINT "rapor_files_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
