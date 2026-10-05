import { MatchMode } from '@prisma/client';
import { Subscription } from 'rxjs';
import { FREE_HINTS_PER_MATCH } from './matches.constants';
import { MatchBoostType, PlayerAnswerRecord } from './matches.types';
import { startingCharges } from './party-rules';

/** armed: the power-up is on for this question; spent: a wrong answer used it up. */
export type SecondChanceState = 'unused' | 'armed' | 'spent';

/** What a running match remembers about one player; the database gets it when the match ends. */
export interface SessionPlayer {
  userId: string;
  connected: boolean;
  score: number;
  correctCount: number;
  answers: PlayerAnswerRecord[];
  freeHintsLeft: number;
  boostsThisRound: Set<MatchBoostType>;
  secondChance: SecondChanceState;
  returnTimer: Subscription | null;
  charges: number;
  sabotagedThisRound: boolean;
  shielded: boolean;
  frozenUntil: number;
}

export function newPlayer(userId: string, mode: MatchMode): SessionPlayer {
  return {
    userId,
    connected: true,
    score: 0,
    correctCount: 0,
    answers: [],
    freeHintsLeft: FREE_HINTS_PER_MATCH,
    boostsThisRound: new Set(),
    secondChance: 'unused',
    returnTimer: null,
    charges: startingCharges(mode),
    sabotagedThisRound: false,
    shielded: false,
    frozenUntil: 0,
  };
}

/** Power-ups, sabotage, shields and freezes count per question. */
export function resetRoundState(player: SessionPlayer): void {
  player.boostsThisRound.clear();
  player.secondChance = 'unused';
  player.sabotagedThisRound = false;
  player.shielded = false;
  player.frozenUntil = 0;
}
