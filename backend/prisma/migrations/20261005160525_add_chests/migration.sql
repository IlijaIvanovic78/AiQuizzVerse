-- CreateEnum
CREATE TYPE "ChestType" AS ENUM ('WOODEN', 'SILVER', 'GOLDEN');

-- CreateEnum
CREATE TYPE "ChestSource" AS ENUM ('DAILY_MATCH', 'VICTORY', 'PATH_STEP', 'LEVEL_UP', 'STREAK');

-- AlterEnum
ALTER TYPE "BoostType" ADD VALUE 'SECOND_CHANCE';

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "is_chest_only" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_chests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ChestType" NOT NULL,
    "source" "ChestSource" NOT NULL,
    "match_id" TEXT,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "reward" JSONB,

    CONSTRAINT "user_chests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_chests_user_id_opened_at_idx" ON "user_chests"("user_id", "opened_at");

-- CreateIndex
CREATE INDEX "user_chests_match_id_idx" ON "user_chests"("match_id");

-- AddForeignKey
ALTER TABLE "user_chests" ADD CONSTRAINT "user_chests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_chests" ADD CONSTRAINT "user_chests_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
