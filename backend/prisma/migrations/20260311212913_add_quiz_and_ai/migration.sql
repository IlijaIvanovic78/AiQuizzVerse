-- CreateEnum
CREATE TYPE "QuizTheme" AS ENUM ('SPACE', 'HISTORY', 'PROGRAMMING', 'SCIENCE', 'GEOGRAPHY', 'LITERATURE', 'MATH', 'GENERAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" "QuizTheme" NOT NULL DEFAULT 'GENERAL',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "num_questions" INTEGER NOT NULL,
    "time_per_question" INTEGER NOT NULL DEFAULT 30,
    "created_by_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'prompt',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_answer" INTEGER NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" BYTEA NOT NULL,
    "source_file" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
