import { Audience } from '@prisma/client';
import { PlannedStep, StepReward } from './learning-paths.types';

export const PATH_PLAN: PlannedStep[] = [
  {
    position: 1,
    goal: 'First steps',
    focus: 'What it is, in the simplest words, with everyday examples.',
    difficulty: 'EASY',
    questionCount: 5,
  },
  {
    position: 2,
    goal: 'Key facts',
    focus: 'The most important names, parts, kinds and facts.',
    difficulty: 'EASY',
    questionCount: 5,
  },
  {
    position: 3,
    goal: 'How and why',
    focus: 'How it works and why it happens.',
    difficulty: 'MEDIUM',
    questionCount: 5,
  },
  {
    position: 4,
    goal: 'Connecting ideas',
    focus: 'How it connects to other things: causes, effects, comparisons and real-life uses.',
    difficulty: 'MEDIUM',
    questionCount: 6,
  },
  {
    position: 5,
    goal: 'Master challenge',
    focus: 'A master challenge: finer details and using everything in new situations.',
    difficulty: 'HARD',
    questionCount: 7,
  },
];

/** Every step is saved as one AI-written quiz, and the daily limit counts those quizzes. */
export const PATH_GENERATION_COST = PATH_PLAN.length;

export const FIRST_STEP_POSITION = 1;
export const MAX_STARS_PER_STEP = 3;

export const STEP_TIME_PER_QUESTION: Record<Audience, number> = {
  KIDS: 45,
  TEENS: 30,
  ADULTS: 20,
};

/** Paid on the first clear of a step; power-ups now come out of the chest. */
export const STEP_REWARDS: Record<number, StepReward> = {
  1: { coins: 20, chest: 'WOODEN' },
  2: { coins: 25, chest: 'SILVER' },
  3: { coins: 30, chest: 'WOODEN' },
  4: { coins: 35, chest: 'SILVER' },
  5: { coins: 60, chest: 'GOLDEN' },
};

export const NOT_YOUR_PATH_MESSAGE = 'This learning path belongs to someone else.';
