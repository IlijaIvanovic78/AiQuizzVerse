import { Prisma } from '@prisma/client';
import { questionFields } from '../quizzes/quiz.mapper';
import {
  PRACTICE_DIFFICULTY,
  PRACTICE_QUIZ_TITLE,
  PRACTICE_TIME_PER_QUESTION,
} from './review.constants';
import { practiceTheme } from './review.rules';
import { ReviewCardView } from './review.types';

export const REVIEW_CARD_INCLUDE = {
  question: {
    include: { quiz: { select: { title: true, theme: true, audience: true, language: true } } },
  },
} satisfies Prisma.ReviewCardInclude;

export type ReviewCardRow = Prisma.ReviewCardGetPayload<{ include: typeof REVIEW_CARD_INCLUDE }>;

export function toReviewCardView(card: ReviewCardRow): ReviewCardView {
  return {
    id: card.id,
    questionText: card.question.text,
    correctAnswer: card.question.options[card.question.correctIndex],
    quizTitle: card.question.quiz.title,
    timesWrong: card.timesWrong,
    correctStreak: card.correctStreak,
    dueOn: card.dueOn,
  };
}

/** Each copied question remembers its original, so answers update the right card. */
export function toPracticeQuizData(
  ownerId: string,
  cards: ReviewCardRow[],
): Prisma.QuizUncheckedCreateInput {
  const firstQuiz = cards[0].question.quiz;
  return {
    title: PRACTICE_QUIZ_TITLE,
    topic: PRACTICE_QUIZ_TITLE,
    theme: practiceTheme(cards.map((card) => card.question.quiz.theme)),
    difficulty: PRACTICE_DIFFICULTY,
    audience: firstQuiz.audience,
    language: firstQuiz.language,
    kind: 'REVIEW',
    timePerQuestion: PRACTICE_TIME_PER_QUESTION,
    ownerId,
    questions: {
      create: cards.map((card, index) => ({
        position: index + 1,
        ...questionFields(card.question),
        sourceQuestionId: card.questionId,
      })),
    },
  };
}
