import { ChestView } from './chest.model';
import { AttackType, MatchMode, SabotageType } from './match.model';
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

export interface MatchInvite {
  matchId: string;
  inviteCode: string;
  mode: MatchMode;
  quizTitle: string;
  from: PublicUser;
}

export interface CoinsUpdatedEvent {
  coins: number;
}

export interface ChestEarnedEvent {
  chest: ChestView;
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
  charges: number;
}

// Option indexes are in the order this player saw, which a scramble can change.
export interface RoundResultEvent {
  matchId: string;
  index: number;
  correctIndex: number;
  explanation: string;
  // Party only: who answered correctly first. Always null in the other modes.
  winnerUserId: string | null;
  players: RoundPlayerResult[];
  teamCorrect: number;
}

export interface LockedOutEvent {
  matchId: string;
  index: number;
  userId: string;
}

// Sent only to the scrambled player, with the options in their new order.
export interface MatchOptionsEvent {
  matchId: string;
  index: number;
  options: string[];
}

// A sabotage that hit a shield. The attacker still spent the charge, and the shield is gone.
// Nobody can raise a shield at someone else, so what was blocked is always an attack.
export interface SabotageBlockedEvent {
  matchId: string;
  index: number;
  type: AttackType;
  fromUserId: string;
  targetUserId: string;
  fromCharges: number;
}

// A sabotage that landed. A shield targets the player who raised it.
export interface SabotagedEvent {
  matchId: string;
  index: number;
  type: SabotageType;
  fromUserId: string;
  targetUserId: string;
  fromCharges: number;
  // 0 for a scramble and a shield, which last until the question ends.
  durationMs: number;
}

// Sent only to the player whose second chance caught a wrong answer.
export interface SecondChanceEvent {
  matchId: string;
  index: number;
  // In the order this player sees the options.
  wrongOption: number;
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
