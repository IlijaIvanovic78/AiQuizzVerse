import { Audience, Difficulty, QuizLanguage } from './quiz.model';
import { BoostType } from './shop.model';

export type PathSource = 'TOPIC' | 'DOCUMENT';

export interface StepReward {
  coins: number;
  boost: BoostType | null;
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
  createdAt: string;
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
  createdAt: string;
  steps: StepView[];
}

export interface PathResult {
  pathId: string;
  stepId: string;
  stars: number;
  cleared: boolean;
  nextStepId: string | null;
  reward: StepReward | null;
}

export interface CreatePathRequest {
  topic?: string;
  documentId?: string;
  audience: Audience;
  language: QuizLanguage;
}
