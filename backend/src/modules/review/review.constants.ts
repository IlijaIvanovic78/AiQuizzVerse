import { Difficulty } from '@prisma/client';

/** Days until the next review: after a mistake, then after 1 and 2 correct answers in a row. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7];

export const MAX_PRACTICE_QUESTIONS = 10;
export const PRACTICE_QUIZ_TITLE = 'Mistakes review';
export const PRACTICE_TIME_PER_QUESTION = 45;
export const PRACTICE_DIFFICULTY: Difficulty = 'MEDIUM';
