-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'SABOTAGE';

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';

