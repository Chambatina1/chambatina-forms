-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "packages" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "embarcador" TEXT NOT NULL DEFAULT 'CHAMBATINA MIAMI',
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "syncedToSolvedcargo" BOOLEAN NOT NULL DEFAULT false,
    "solvedcargoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_trackingNumber_key" ON "Submission"("trackingNumber");
