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
  /** General name of the step, e.g. "How and why". The AI writes a title about the topic. */
  label: string;
  /** What each step of the path covers, in step order, so every step stays in its own lane. */
  stepFocuses: string[];
}

export type WriterStep = 'writing' | 'reviewing';
