export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type Audience = 'KIDS' | 'TEENS' | 'ADULTS';

export type QuizLanguage = 'EN' | 'SR';

export type QuizTheme =
  | 'SPACE'
  | 'HISTORY'
  | 'SCIENCE'
  | 'NATURE'
  | 'GEOGRAPHY'
  | 'MATH'
  | 'LANGUAGE'
  | 'ART'
  | 'MUSIC'
  | 'SPORTS'
  | 'TECHNOLOGY'
  | 'GENERAL';

export type QuizKind = 'STANDARD' | 'PATH_STEP' | 'REVIEW';

export type QuizSource = 'TOPIC' | 'DOCUMENT' | 'MANUAL';

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
  createdAt: string;
  bestAccuracy: number | null;
}

export interface QuestionView {
  id: string;
  position: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface QuizDetail extends QuizSummary {
  questions: QuestionView[];
}

export interface QuestionInput {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface CreateQuizRequest {
  title: string;
  topic: string;
  theme: QuizTheme;
  difficulty: Difficulty;
  audience: Audience;
  language: QuizLanguage;
  timePerQuestion: number;
  questions: QuestionInput[];
}

export interface GenerateQuizRequest {
  topic?: string;
  documentId?: string;
  difficulty: Difficulty;
  audience: Audience;
  language: QuizLanguage;
  questionCount: number;
  timePerQuestion: number;
}

export interface UpdateQuizRequest {
  title?: string;
  timePerQuestion?: number;
}
