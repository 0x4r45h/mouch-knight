-- CreateTable
CREATE TABLE "player_cooldowns" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "last_played" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_cooldowns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_cooldowns_player_id_key" ON "player_cooldowns"("player_id");

-- AddForeignKey
ALTER TABLE "player_cooldowns" ADD CONSTRAINT "player_cooldowns_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
