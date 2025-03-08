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
ALTER TABLE "player_moves" ADD CONSTRAINT "player_moves_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
