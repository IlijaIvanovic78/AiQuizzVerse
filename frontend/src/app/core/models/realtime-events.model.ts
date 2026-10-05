import { MatchMode } from './match.model';
import { MatchBoostType } from './shop.model';
import { PublicUser } from './user.model';

export type GenerationStep = 'reading' | 'writing' | 'reviewing' | 'saving';

export interface QuizProgress {
  step: GenerationStep;
  done: number;
  total: number;
}

export interface PresenceEvent {
  userId: string;
}

export interface RequestRemovedEvent {
  requestId: string;
}

export interface FriendRemovedEvent {
  friendshipId: string;
}

export interface DuelInvite {
  matchId: string;
  inviteCode: string;
  mode: MatchMode;
  quizTitle: string;
  from: PublicUser;
}

export interface CoinsUpdatedEvent {
  coins: number;
}

export interface MatchStartingEvent {
  matchId: string;
  countdownSeconds: number;
}

export interface MatchQuestionEvent {
  matchId: string;
  index: number;
  total: number;
  text: string;
  options: string[];
  timeLimitSeconds: number;
  remainingMs: number;
}

export interface PlayerAnsweredEvent {
  matchId: string;
  userId: string;
}

export interface MatchDeadlineEvent {
  matchId: string;
  index: number;
  remainingMs: number;
}

export interface RoundPlayerResult {
  userId: string;
  optionIndex: number | null;
  correct: boolean;
  points: number;
  score: number;
}

export interface RoundResultEvent {
  matchId: string;
  index: number;
  correctIndex: number;
  explanation: string;
  players: RoundPlayerResult[];
  teamCorrect: number;
}

export interface WaitingNextEvent {
  matchId: string;
  userIds: string[];
}

export interface BoostUsedEvent {
  matchId: string;
  type: MatchBoostType;
  eliminatedOptions?: number[];
  hint?: string;
  remainingMs?: number;
  remaining: number;
}

export interface PlayerLeftEvent {
  matchId: string;
  userId: string;
}

export interface MatchErrorEvent {
  matchId: string;
  message: string;
}
