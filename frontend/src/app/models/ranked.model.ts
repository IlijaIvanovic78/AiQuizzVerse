import { QuizTheme, Difficulty } from './quiz.model';

export interface RankedStage {
  id: string;
  journeyId: string;
  stageNumber: number;
  quizId: string;
  difficulty: Difficulty;
  isCompleted: boolean;
  score: number | null;
  earnedReward: { type: string; amount: number } | null;
  quiz?: {
    id: string;
    title: string;
    theme: QuizTheme;
    numQuestions?: number;
    timePerQuestion?: number;
  };
}

export interface RankedJourney {
  id: string;
  userId: string;
  topic: string;
  totalStages: number;
  currentStage: number;
  isCompleted: boolean;
  createdAt: string;
  stages: RankedStage[];
}

export interface StageCompleteResult {
  stage: RankedStage;
  reward: { type: string; amount: number };
  journeyCompleted: boolean;
}
