-- CreateTable
CREATE TABLE "public"."game_over_records" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "updateHighscoreTxHash" TEXT,
    "sendUserScoreTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_over_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_over_records_playerId_chainId_sessionId_key" ON "public"."game_over_records"("playerId", "chainId", "sessionId");

-- AddForeignKey
ALTER TABLE "public"."game_over_records" ADD CONSTRAINT "game_over_records_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
