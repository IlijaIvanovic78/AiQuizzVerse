import { Audience, BoostType, Difficulty, PathStep, QuizLanguage } from '@prisma/client';

export type PathSource = 'TOPIC' | 'DOCUMENT';

export interface StepReward {
  coins: number;
  boost: BoostType | null;
}

export interface PathResult {
  pathId: string;
  stepId: string;
  stars: number;
  cleared: boolean;
  nextStepId: string | null;
  reward: StepReward | null;
}

export type StepWithOwner = PathStep & { path: { ownerId: string } };

/** One row of PATH_PLAN: what a step teaches and how hard its quiz is. */
export interface PlannedStep {
  position: number;
  goal: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface PathRequest {
  topic: string | null;
  audience: Audience;
  language: QuizLanguage;
}

export interface NextPathStep {
  id: string;
  position: number;
  title: string;
  quizId: string;
}

export interface PathSummary {
  id: string;
  topic: string;
  audience: Audience;
  language: QuizLanguage;
  stepsCleared: number;
  totalSteps: number;
  stars: number;
  maxStars: number;
  nextStep: NextPathStep | null;
  createdAt: Date;
}

export interface StepView {
  id: string;
  position: number;
  title: string;
  keyPoints: string[];
  difficulty: Difficulty;
  quizId: string;
  questionCount: number;
  stars: number;
  bestAccuracy: number;
  unlocked: boolean;
  cleared: boolean;
  reward: StepReward;
}

export interface PathDetail {
  id: string;
  topic: string;
  audience: Audience;
  language: QuizLanguage;
  source: PathSource;
  createdAt: Date;
  steps: StepView[];
}
