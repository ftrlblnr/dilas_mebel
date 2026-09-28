-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Lead_archivedAt_idx" ON "Lead"("archivedAt");
