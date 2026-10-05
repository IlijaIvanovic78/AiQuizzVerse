import {
  Audience,
  Difficulty,
  QuizKind,
  QuizLanguage,
  QuizSource,
  QuizTheme,
} from '@prisma/client';
import { GeneratedQuiz } from '../ai/ai.schemas';

export interface QuizSummary {
  id: string;
  title: string;
  topic: string;
  theme: QuizTheme;
  difficulty: Difficulty;
  audience: Audience;
  language: QuizLanguage;
  questionCount: number;
  timePerQuestion: number;
  source: QuizSource;
  createdAt: Date;
  bestAccuracy: number | null;
}

export interface QuestionContent {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface QuestionView extends QuestionContent {
  id: string;
  position: number;
}

export interface QuizDetail extends QuizSummary {
  questions: QuestionView[];
}

/** A quiz written by the AI, ready to be stored for its owner. */
export interface GeneratedQuizToSave {
  ownerId: string;
  kind: QuizKind;
  topic: string;
  documentId: string | null;
  difficulty: Difficulty;
  audience: Audience;
  language: QuizLanguage;
  timePerQuestion: number;
  quiz: GeneratedQuiz;
}
