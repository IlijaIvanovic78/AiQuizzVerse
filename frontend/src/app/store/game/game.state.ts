import { Match, GameQuestion, MatchType, AnswerResult } from '../../models';

export interface GameState {
  currentMatch: Match | null;
  currentQuestion: GameQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  timePerQuestion: number;
  playerScore: number;
  opponentScore: number;
  mode: MatchType | null;
  status: 'IDLE' | 'LOBBY' | 'PLAYING' | 'FINISHED';
  lastResult: AnswerResult | null;
  allResults: AnswerResult[];
  waitingForOpponent: boolean;
  currentTurn: string | null; // userId for co-op
  loading: boolean;
  error: string | null;
}

export const initialGameState: GameState = {
  currentMatch: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  totalQuestions: 0,
  timePerQuestion: 30,
  playerScore: 0,
  opponentScore: 0,
  mode: null,
  status: 'IDLE',
  lastResult: null,
  allResults: [],
  waitingForOpponent: false,
  currentTurn: null,
  loading: false,
  error: null,
};
