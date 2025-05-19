/*
  Warnings:

  - A unique constraint covering the columns `[fId]` on the table `players` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "fDisplayName" TEXT,
ADD COLUMN     "fId" INTEGER,
ADD COLUMN     "fLocationDescription" TEXT,
ADD COLUMN     "fLocationPlaceId" TEXT,
ADD COLUMN     "fPfpUrl" TEXT,
ADD COLUMN     "fUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "players_fId_key" ON "players"("fId");
