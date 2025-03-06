-- CreateTable
CREATE TABLE "high_scores" (
    "id" SERIAL NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "player_address" VARCHAR(42) NOT NULL,
    "score" INTEGER NOT NULL,
    "session_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "high_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_tracker" (
    "id" SERIAL NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractName" TEXT NOT NULL,
    "lastScannedBlock" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_tracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "high_scores_chain_id_idx" ON "high_scores"("chain_id");

-- CreateIndex
CREATE INDEX "high_scores_player_address_idx" ON "high_scores"("player_address");

-- CreateIndex
CREATE UNIQUE INDEX "high_scores_chain_id_player_address_session_id_key" ON "high_scores"("chain_id", "player_address", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "block_tracker_chainId_contractName_key" ON "block_tracker"("chainId", "contractName");
