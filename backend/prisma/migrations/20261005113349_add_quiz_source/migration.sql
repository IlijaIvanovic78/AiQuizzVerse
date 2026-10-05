-- CreateEnum
CREATE TYPE "QuizSource" AS ENUM ('TOPIC', 'DOCUMENT', 'MANUAL');

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "source" "QuizSource" NOT NULL DEFAULT 'MANUAL';

-- Quizzes made from a lesson PDF are the only existing ones we can tell apart
UPDATE "quizzes" SET "source" = 'DOCUMENT' WHERE "document_id" IS NOT NULL;
