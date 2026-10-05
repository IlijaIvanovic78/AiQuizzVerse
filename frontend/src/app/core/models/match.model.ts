import { PathResult } from './path.model';
import { QuizKind, QuizTheme } from './quiz.model';
import { PublicUser } from './user.model';

export type MatchMode = 'SOLO' | 'DUEL' | 'TEAM';

export type MatchStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';

export type MatchOutcome = 'WIN' | 'LOSS' | 'DRAW' | 'DONE';

export interface MatchQuizInfo {
  id: string;
  title: string;
  theme: QuizTheme;
  questionCount: number;
  timePerQuestion: number;
  kind: QuizKind;
}

export interface MatchPlayerView {
  user: PublicUser;
  score: number;
  correctCount: number;
  isConnected: boolean;
}

export interface MatchView {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  inviteCode: string | null;
  hostId: string;
  quiz: MatchQuizInfo;
  players: MatchPlayerView[];
}

export interface MatchResultPlayer {
  user: PublicUser;
  score: number;
  correctCount: number;
  isWinner: boolean;
  xpEarned: number;
  coinsEarned: number;
}

export interface MatchResultQuestion {
  questionId: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  myAnswer: number | null;
}

export interface MatchResult {
  matchId: string;
  mode: MatchMode;
  quizId: string;
  quizTitle: string;
  theme: QuizTheme;
  kind: QuizKind;
  questionCount: number;
  players: MatchResultPlayer[];
  questions: MatchResultQuestion[];
  path: PathResult | null;
  leveledUp: boolean;
  coinCapReached: boolean;
}

export interface MatchHistoryEntry {
  matchId: string;
  mode: MatchMode;
  quizTitle: string;
  theme: QuizTheme;
  playedAt: string;
  myScore: number;
  correctCount: number;
  questionCount: number;
  result: MatchOutcome;
  opponent: PublicUser | null;
}

export interface CreateMatchRequest {
  quizId: string;
  mode: MatchMode;
  inviteFriendId?: string;
}

export interface JoinMatchRequest {
  inviteCode: string;
}

export interface InviteToMatchRequest {
  friendId: string;
}
