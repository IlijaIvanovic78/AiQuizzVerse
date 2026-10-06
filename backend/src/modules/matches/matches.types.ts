import {
  BoostType,
  Difficulty,
  MatchMode,
  MatchStatus,
  Question,
  QuizKind,
  QuizLanguage,
  QuizTheme,
} from '@prisma/client';
import { Namespace, Socket } from 'socket.io';
import { ChestView } from '../chests/chests.types';
import { PathResult } from '../learning-paths/learning-paths.types';
import { MatchOutcome } from '../progression/progression.types';
import { PublicUser } from '../users/users.types';
import { AnswerDto } from './dto/answer.dto';
import { MatchIdDto } from './dto/match-id.dto';
import { NextQuestionDto } from './dto/next-question.dto';
import { SabotageDto } from './dto/sabotage.dto';
import { UseBoostDto } from './dto/use-boost.dto';

export type MatchBoostType = Exclude<BoostType, 'STREAK_FREEZE'>;

export type SabotageType = 'INK' | 'FREEZE' | 'SCRAMBLE' | 'FOG' | 'QUAKE' | 'MIRROR' | 'SHIELD';

/**
 * Stored in MatchPlayer.answers; optionIndex is in the stored order, not the shuffled one.
 * A type, not an interface, so Prisma accepts it as a Json value.
 */
export type PlayerAnswerRecord = {
  questionId: string;
  optionIndex: number | null;
  correct: boolean;
  points: number;
};

export interface MatchQuizView {
  id: string;
  title: string;
  theme: QuizTheme;
  language: QuizLanguage;
  questionCount: number;
  timePerQuestion: number;
  kind: QuizKind;
}

export interface MatchPlayerView {
  user: PublicUser;
  score: number;
  correctCount: number;
  isConnected: boolean;
  /** Sabotage charges; always 0 outside party matches. */
  charges: number;
}

/** Numbers a running match keeps in memory; the database gets them only when it ends. */
export interface LivePlayerStats {
  userId: string;
  score: number;
  correctCount: number;
  charges: number;
}

export interface MatchView {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  inviteCode: string | null;
  hostId: string;
  quiz: MatchQuizView;
  players: MatchPlayerView[];
}

export interface MatchHistoryEntry {
  matchId: string;
  mode: MatchMode;
  quizTitle: string;
  theme: QuizTheme;
  playedAt: Date;
  myScore: number;
  correctCount: number;
  questionCount: number;
  result: MatchOutcome;
  opponent: PublicUser | null;
}

export interface ResultPlayer {
  user: PublicUser;
  score: number;
  correctCount: number;
  isWinner: boolean;
  xpEarned: number;
  coinsEarned: number;
}

export interface ResultQuestion {
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
  players: ResultPlayer[];
  questions: ResultQuestion[];
  path: PathResult | null;
  leveledUp: boolean;
  coinCapReached: boolean;
  /** The chests this match earned for the player who gets the result. */
  chestsEarned: ChestView[];
}

export interface StartingPayload {
  matchId: string;
  countdownSeconds: number;
}

export interface QuestionPayload {
  matchId: string;
  index: number;
  total: number;
  text: string;
  options: string[];
  timeLimitSeconds: number;
  remainingMs: number;
}

export interface PlayerEventPayload {
  matchId: string;
  userId: string;
}

export interface DeadlinePayload {
  matchId: string;
  index: number;
  remainingMs: number;
}

export interface RoundPlayerResult {
  userId: string;
  /** In the shuffled order the players saw. */
  optionIndex: number | null;
  correct: boolean;
  points: number;
  score: number;
  charges: number;
}

/** Sent to each player separately, with option indexes in the order that player saw. */
export interface RoundResultPayload {
  matchId: string;
  index: number;
  correctIndex: number;
  explanation: string;
  /** Party matches: who answered correctly first. Always null in other modes. */
  winnerUserId: string | null;
  players: RoundPlayerResult[];
  teamCorrect: number;
}

export interface LockedOutPayload {
  matchId: string;
  index: number;
  userId: string;
}

export interface OptionsPayload {
  matchId: string;
  index: number;
  options: string[];
}

export interface SabotagePayload {
  matchId: string;
  index: number;
  type: SabotageType;
  fromUserId: string;
  targetUserId: string;
  fromCharges: number;
}

export interface SabotagedPayload extends SabotagePayload {
  /** How long the effect lasts; 0 for SCRAMBLE and SHIELD, which last until the question ends. */
  durationMs: number;
}

export interface SecondChancePayload {
  matchId: string;
  index: number;
  /** The wrong option the player picked first, in the order that player sees. */
  wrongOption: number;
}

/** A scored round in the stored option order, so every player can get it in their own order. */
export interface PlayedRound {
  index: number;
  winnerUserId: string | null;
  players: ScoredAnswer[];
  teamCorrect: number;
}

export interface ScoredAnswer {
  userId: string;
  storedIndex: number | null;
  correct: boolean;
  points: number;
  score: number;
  charges: number;
}

export interface WaitingNextPayload {
  matchId: string;
  userIds: string[];
}

export interface BoostEffect {
  eliminatedOptions?: number[];
  hint?: string;
  remainingMs?: number;
}

export interface BoostUsedPayload extends BoostEffect {
  matchId: string;
  type: MatchBoostType;
  /** How many more times this power-up can be used in this match (hints include the free ones). */
  remaining: number;
}

export interface MatchErrorPayload {
  matchId: string;
  message: string;
}

export interface GameServerToClientEvents {
  'match:lobby': (payload: MatchView) => void;
  'match:starting': (payload: StartingPayload) => void;
  'match:question': (payload: QuestionPayload) => void;
  'match:answered': (payload: PlayerEventPayload) => void;
  'match:deadline': (payload: DeadlinePayload) => void;
  'match:round-result': (payload: RoundResultPayload) => void;
  'match:waiting-next': (payload: WaitingNextPayload) => void;
  'match:boost-used': (payload: BoostUsedPayload) => void;
  'match:locked-out': (payload: LockedOutPayload) => void;
  'match:options': (payload: OptionsPayload) => void;
  'match:sabotaged': (payload: SabotagedPayload) => void;
  /** The sabotage hit a shield; the attacker still spent the charge. */
  'match:sabotage-blocked': (payload: SabotagePayload) => void;
  'match:second-chance': (payload: SecondChancePayload) => void;
  'match:finished': (payload: MatchResult) => void;
  'match:player-left': (payload: PlayerEventPayload) => void;
  'match:error': (payload: MatchErrorPayload) => void;
}

export interface GameClientToServerEvents {
  'match:join': (payload: MatchIdDto) => void;
  'match:leave': (payload: MatchIdDto) => void;
  'match:start': (payload: MatchIdDto) => void;
  'match:answer': (payload: AnswerDto) => void;
  'match:next': (payload: NextQuestionDto) => void;
  'match:boost': (payload: UseBoostDto) => void;
  'match:sabotage': (payload: SabotageDto) => void;
}

export interface GameSocketData {
  userId: string;
  /** The match room this socket joined last, so a disconnect knows which match to update. */
  matchId?: string;
}

export type GameServer = Namespace<
  GameClientToServerEvents,
  GameServerToClientEvents,
  Record<string, never>,
  GameSocketData
>;

export type GameSocket = Socket<
  GameClientToServerEvents,
  GameServerToClientEvents,
  Record<string, never>,
  GameSocketData
>;

/** Sabotage ownership is read once at the start, so the rounds can check it without waiting. */
export interface SessionMatchPlayer {
  userId: string;
  sabotages: SabotageType[];
}

export interface SessionMatch {
  id: string;
  mode: MatchMode;
  hostId: string;
  quiz: { id: string; kind: QuizKind; difficulty: Difficulty; timePerQuestion: number };
  players: SessionMatchPlayer[];
}

export interface SessionSetup {
  match: SessionMatch;
  questions: Question[];
}

export type EndStatus = Extract<MatchStatus, 'FINISHED' | 'ABANDONED'>;

export interface PlayerSummary {
  userId: string;
  score: number;
  correctCount: number;
  isWinner: boolean;
  /** Can win or draw. In a party only the players still here at the end are ranked. */
  ranked: boolean;
  answers: PlayerAnswerRecord[];
  /** Finished match: everyone gets rewards and review cards. Abandoned: only those still here. */
  rewarded: boolean;
}

export interface MatchSummary {
  match: SessionMatch;
  status: EndStatus;
  questions: Question[];
  players: PlayerSummary[];
}

export interface FinishedPlayer {
  userId: string;
  result: MatchResult;
  coins: number;
}
