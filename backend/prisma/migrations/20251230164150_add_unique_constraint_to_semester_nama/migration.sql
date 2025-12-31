/*
  Warnings:

  - A unique constraint covering the columns `[nama]` on the table `semesters` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "semesters_nama_key" ON "semesters"("nama");
