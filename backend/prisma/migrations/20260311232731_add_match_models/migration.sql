-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('PVP', 'COOP', 'RANKED', 'SOLO');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "type" "MatchType" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'WAITING',
    "quiz_id" TEXT NOT NULL,
    "invite_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matches_invite_code_key" ON "matches"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_match_id_user_id_key" ON "match_players"("match_id", "user_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
