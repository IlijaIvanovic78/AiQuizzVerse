-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('KIDS', 'TEENS', 'ADULTS');

-- CreateEnum
CREATE TYPE "QuizLanguage" AS ENUM ('EN', 'SR');

-- CreateEnum
CREATE TYPE "QuizTheme" AS ENUM ('SPACE', 'HISTORY', 'SCIENCE', 'NATURE', 'GEOGRAPHY', 'MATH', 'LANGUAGE', 'ART', 'MUSIC', 'SPORTS', 'TECHNOLOGY', 'GENERAL');

-- CreateEnum
CREATE TYPE "QuizKind" AS ENUM ('STANDARD', 'PATH_STEP', 'REVIEW');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "MatchMode" AS ENUM ('SOLO', 'DUEL', 'TEAM');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('AVATAR', 'PET');

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('HINT', 'FIFTY_FIFTY', 'EXTRA_TIME', 'STREAK_FREEZE');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "two_fa_secret" TEXT,
    "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token_hash" TEXT,
    "avatar_key" TEXT,
    "pet_key" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 100,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_played_on" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "character_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "theme" "QuizTheme" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "audience" "Audience" NOT NULL,
    "language" "QuizLanguage" NOT NULL,
    "kind" "QuizKind" NOT NULL DEFAULT 'STANDARD',
    "time_per_question" INTEGER NOT NULL,
    "owner_id" TEXT NOT NULL,
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT[],
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "source_question_id" TEXT,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "document_id" TEXT,
    "audience" "Audience" NOT NULL,
    "language" "QuizLanguage" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_steps" (
    "id" TEXT NOT NULL,
    "path_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "key_points" TEXT[],
    "difficulty" "Difficulty" NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "best_accuracy" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "path_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "mode" "MatchMode" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'WAITING',
    "quiz_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "invite_code" TEXT,
    "step_reward" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "coins_earned" INTEGER NOT NULL DEFAULT 0,
    "leveled_up" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "times_wrong" INTEGER NOT NULL DEFAULT 1,
    "correct_streak" INTEGER NOT NULL DEFAULT 0,
    "due_on" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "price" INTEGER NOT NULL,
    "min_level" INTEGER NOT NULL DEFAULT 1,
    "is_starter" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_boosts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BoostType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "provider_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "friendships_receiver_id_idx" ON "friendships"("receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_sender_id_receiver_id_key" ON "friendships"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "documents_owner_id_idx" ON "documents"("owner_id");

-- CreateIndex
CREATE INDEX "quizzes_owner_id_kind_idx" ON "quizzes"("owner_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "questions_quiz_id_position_key" ON "questions"("quiz_id", "position");

-- CreateIndex
CREATE INDEX "learning_paths_owner_id_idx" ON "learning_paths"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "path_steps_quiz_id_key" ON "path_steps"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "path_steps_path_id_position_key" ON "path_steps"("path_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "matches_invite_code_key" ON "matches"("invite_code");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "match_players_user_id_idx" ON "match_players"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_match_id_user_id_key" ON "match_players"("match_id", "user_id");

-- CreateIndex
CREATE INDEX "review_cards_user_id_due_on_idx" ON "review_cards"("user_id", "due_on");

-- CreateIndex
CREATE UNIQUE INDEX "review_cards_user_id_question_id_key" ON "review_cards"("user_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_items_user_id_item_id_key" ON "user_items"("user_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_boosts_user_id_type_key" ON "user_boosts"("user_id", "type");

-- CreateIndex
CREATE INDEX "purchases_user_id_created_at_idx" ON "purchases"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_steps" ADD CONSTRAINT "path_steps_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_steps" ADD CONSTRAINT "path_steps_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
