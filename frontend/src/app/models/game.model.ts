import { QuizTheme } from './quiz.model';

export type MatchType = 'PVP' | 'COOP' | 'RANKED' | 'SOLO';
export type MatchStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MatchPlayer {
  id: string;
  matchId: string;
  userId: string;
  score: number;
  isWinner: boolean;
  answers: AnswerRecord[] | null;
  user: { id: string; username: string; avatarUrl: string | null };
}

export interface AnswerRecord {
  questionId: string;
  answer: number;
  timeMs: number;
  correct: boolean;
  points: number;
}

export interface Match {
  id: string;
  type: MatchType;
  status: MatchStatus;
  quizId: string;
  inviteCode: string | null;
  createdAt: string;
  endedAt: string | null;
  players: MatchPlayer[];
  quiz: {
    id: string;
    title: string;
    theme: QuizTheme;
    numQuestions: number;
    timePerQuestion: number;
  };
}

/** Question sent via socket (no correctAnswer) */
export interface GameQuestion {
  id: string;
  text: string;
  options: string[];
  index: number;
}

export interface AnswerResult {
  correct: boolean;
  points: number;
  correctAnswer: number;
  explanation: string | null;
  userId: string;
  answer: number;
  username?: string;
}

export interface RoundResults {
  results: AnswerResult[];
}

export interface MatchStartedEvent {
  matchId: string;
  question: GameQuestion;
  questionIndex: number;
  totalQuestions: number;
  timePerQuestion: number;
  currentTurn: string | null;
}

export interface NextQuestionEvent {
  question: GameQuestion;
  questionIndex: number;
  currentTurn: string | null;
}
