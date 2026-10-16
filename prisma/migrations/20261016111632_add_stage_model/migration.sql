-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "comment" TEXT,
    "preferredTime" TEXT,
    "itemsJson" TEXT NOT NULL DEFAULT '[]',
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "stageId" TEXT,
    "lostReason" TEXT,
    "lostReasonNote" TEXT,
    "customerId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "archivedAt" DATETIME,
    "overdueNotifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("archivedAt", "assignedToId", "city", "comment", "createdAt", "customerId", "email", "fullName", "id", "itemsJson", "lostReason", "lostReasonNote", "overdueNotifiedAt", "phone", "preferredTime", "refNumber", "source", "status", "totalPrice", "updatedAt") SELECT "archivedAt", "assignedToId", "city", "comment", "createdAt", "customerId", "email", "fullName", "id", "itemsJson", "lostReason", "lostReasonNote", "overdueNotifiedAt", "phone", "preferredTime", "refNumber", "source", "status", "totalPrice", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE UNIQUE INDEX "Lead_refNumber_key" ON "Lead"("refNumber");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_stageId_idx" ON "Lead"("stageId");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");
CREATE INDEX "Lead_archivedAt_idx" ON "Lead"("archivedAt");
CREATE INDEX "Lead_customerId_idx" ON "Lead"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Stage_key_key" ON "Stage"("key");

-- CreateIndex
CREATE INDEX "Stage_order_idx" ON "Stage"("order");
