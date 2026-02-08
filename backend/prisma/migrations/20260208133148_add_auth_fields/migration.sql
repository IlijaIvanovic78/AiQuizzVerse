-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_fa_secret" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
