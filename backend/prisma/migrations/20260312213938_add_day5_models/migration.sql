-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('HAT', 'ARMOR', 'WEAPON', 'SHIELD', 'BADGE', 'PET');

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('HINT', 'EXTRA_TIME', 'FIFTY_FIFTY', 'DOUBLE_POINTS', 'SHIELD', 'STREAK_FREEZE');

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "image_path" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "min_level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "is_equipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_boosts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BoostType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranked_journeys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "total_stages" INTEGER NOT NULL,
    "current_stage" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranked_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranked_stages" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "stage_number" INTEGER NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "earned_reward" JSONB,

    CONSTRAINT "ranked_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_items_user_id_item_id_key" ON "user_items"("user_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_boosts_user_id_type_key" ON "user_boosts"("user_id", "type");

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranked_journeys" ADD CONSTRAINT "ranked_journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranked_stages" ADD CONSTRAINT "ranked_stages_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "ranked_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranked_stages" ADD CONSTRAINT "ranked_stages_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
