import { Audience, Difficulty, QuizLanguage } from '@prisma/client';

export interface QuizRequest {
  /** Null when the quiz is built only from a lesson PDF. */
  topic: string | null;
  difficulty: Difficulty;
  audience: Audience;
  language: QuizLanguage;
  questionCount: number;
}

export interface PathStepRequest extends QuizRequest {
  /** 1-based position of the step in its learning path. */
  position: number;
  /** What this step is for, e.g. "How and why". */
  goal: string;
}

export type WriterStep = 'writing' | 'reviewing';
