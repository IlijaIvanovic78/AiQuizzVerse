-- AlterEnum
BEGIN;
-- Old duels become two-player party matches, so no row uses DUEL when it leaves the enum.
UPDATE "matches" SET "mode" = 'PARTY' WHERE "mode" = 'DUEL';
CREATE TYPE "MatchMode_new" AS ENUM ('SOLO', 'TEAM', 'PARTY');
ALTER TABLE "matches" ALTER COLUMN "mode" TYPE "MatchMode_new" USING ("mode"::text::"MatchMode_new");
ALTER TYPE "MatchMode" RENAME TO "MatchMode_old";
ALTER TYPE "MatchMode_new" RENAME TO "MatchMode";
DROP TYPE "public"."MatchMode_old";
COMMIT;
