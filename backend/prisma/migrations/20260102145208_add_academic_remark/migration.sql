-- CreateTable
CREATE TABLE "academic_remarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "catatan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_remarks_userId_kelasId_semesterId_key" ON "academic_remarks"("userId", "kelasId", "semesterId");

-- AddForeignKey
ALTER TABLE "academic_remarks" ADD CONSTRAINT "academic_remarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_remarks" ADD CONSTRAINT "academic_remarks_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_remarks" ADD CONSTRAINT "academic_remarks_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
