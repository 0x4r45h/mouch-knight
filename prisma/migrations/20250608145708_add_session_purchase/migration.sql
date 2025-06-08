-- CreateTable
CREATE TABLE "session_purchases" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_cost" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_purchases_tx_hash_key" ON "session_purchases"("tx_hash");

-- AddForeignKey
ALTER TABLE "session_purchases" ADD CONSTRAINT "session_purchases_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
