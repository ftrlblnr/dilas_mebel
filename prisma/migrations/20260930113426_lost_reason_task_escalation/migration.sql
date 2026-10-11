-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "lostReason" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lostReasonNote" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "escalatedAt" DATETIME;
ALTER TABLE "Task" ADD COLUMN "overdueNotifiedAt" DATETIME;

