-- CreateTable
CREATE TABLE "high_scores" (
    "id" SERIAL NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_moves" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "session_id" INTEGER NOT NULL,
    "verification_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_moves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "high_scores_chain_id_idx" ON "high_scores"("chain_id");

-- CreateIndex
CREATE INDEX "high_scores_player_id_idx" ON "high_scores"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "high_scores_chain_id_player_id_session_id_score_key" ON "high_scores"("chain_id", "player_id", "session_id", "score");

-- CreateIndex
CREATE UNIQUE INDEX "block_tracker_chainId_contractName_key" ON "block_tracker"("chainId", "contractName");

-- CreateIndex
CREATE UNIQUE INDEX "players_address_key" ON "players"("address");

-- CreateIndex
CREATE INDEX "players_address_idx" ON "players"("address");

-- CreateIndex
CREATE UNIQUE INDEX "player_moves_verification_hash_key" ON "player_moves"("verification_hash");

-- CreateIndex
CREATE INDEX "player_moves_chain_id_idx" ON "player_moves"("chain_id");

-- CreateIndex
CREATE INDEX "player_moves_player_id_idx" ON "player_moves"("player_id");

-- AddForeignKey
ALTER TABLE "high_scores" ADD CONSTRAINT "high_scores_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_moves" ADD CONSTRAINT "player_moves_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
