-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_played_at" TIMESTAMP(3),
ADD COLUMN     "longest_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pet_url" TEXT;
