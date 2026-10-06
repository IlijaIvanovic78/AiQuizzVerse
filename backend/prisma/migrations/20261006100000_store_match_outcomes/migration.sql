-- CreateEnum
CREATE TYPE "MatchOutcome" AS ENUM ('WIN', 'LOSS', 'DRAW', 'DONE');

-- AlterTable
ALTER TABLE "match_players" ADD COLUMN     "outcome" "MatchOutcome" NOT NULL DEFAULT 'DONE';

-- Backfill: winners WIN, the other party players LOSS. Solo and team players who did not win
-- keep DONE.
UPDATE "match_players" SET "outcome" = 'WIN' WHERE "is_winner";

UPDATE "match_players" SET "outcome" = 'LOSS'
FROM "matches"
WHERE "matches"."id" = "match_players"."match_id"
  AND "matches"."mode" = 'PARTY'
  AND NOT "match_players"."is_winner";

-- A finished party without a winner was a draw for the players who shared the top score.
UPDATE "match_players" SET "outcome" = 'DRAW'
FROM "matches"
WHERE "matches"."id" = "match_players"."match_id"
  AND "matches"."mode" = 'PARTY'
  AND "matches"."status" = 'FINISHED'
  AND NOT EXISTS (
    SELECT 1 FROM "match_players" AS "winner"
    WHERE "winner"."match_id" = "matches"."id" AND "winner"."is_winner"
  )
  AND (
    SELECT COUNT(*) FROM "match_players" AS "other"
    WHERE "other"."match_id" = "matches"."id" AND "other"."score" = "match_players"."score"
  ) > 1
  AND "match_players"."score" = (
    SELECT MAX("top"."score") FROM "match_players" AS "top"
    WHERE "top"."match_id" = "matches"."id"
  );

-- AlterTable
ALTER TABLE "match_players" DROP COLUMN "is_winner";
