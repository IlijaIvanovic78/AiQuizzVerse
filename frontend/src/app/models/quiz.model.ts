export type QuizTheme =
  | 'SPACE'
  | 'HISTORY'
  | 'PROGRAMMING'
  | 'SCIENCE'
  | 'GEOGRAPHY'
  | 'LITERATURE'
  | 'MATH'
  | 'GENERAL'
  | 'CUSTOM';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface Question {
  id: string;
  quizId: string;
  text: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  explanation: string | null;
}

export interface Quiz {
  id: string;
  title: string;
  theme: QuizTheme;
  difficulty: Difficulty;
  numQuestions: number;
  timePerQuestion: number;
  createdById: string;
  sourceType: 'prompt' | 'pdf';
  createdAt: string;
  questions: Question[];
}

/** Quiz list item (from GET /quizzes — includes _count instead of full questions) */
export interface QuizListItem {
  id: string;
  title: string;
  theme: QuizTheme;
  difficulty: Difficulty;
  numQuestions: number;
  timePerQuestion: number;
  sourceType: 'prompt' | 'pdf';
  createdAt: string;
  _count: { questions: number };
}

/** Request body for POST /ai/generate-quiz */
export interface GenerateQuizRequest {
  topic: string;
  difficulty: Difficulty;
  numQuestions: number;
  timePerQuestion: number;
  sourceType: 'prompt' | 'pdf';
}

/** Response from POST /upload/pdf */
export interface UploadPdfResponse {
  fileName: string;
  chunks: number;
  message: string;
}
