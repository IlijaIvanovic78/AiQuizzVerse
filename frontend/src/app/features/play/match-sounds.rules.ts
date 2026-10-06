import { MatchMode, MatchResult } from '../../core/models/match.model';
import { RoundResultEvent } from '../../core/models/realtime-events.model';
import { STAR_POP_DELAY_MS, STAR_POP_PEAK_MS } from '../../shared/stars';
import { resultHeadline } from './match-result.rules';
import { GO_LABEL, TIMER_URGENT_SECONDS, TIMER_WARNING_SECONDS } from './play.constants';

export type CountdownSound = 'beep' | 'go';

export type TimerTick = 'tick' | 'urgent';

export type RoundSound = 'correct' | 'wrong' | 'round-lost' | 'time-up';

export type EndingSound = 'victory' | 'almost' | 'draw' | 'stars';

// 3, 2 and 1 beep, and GO! jumps up.
export function countdownSound(label: string | null): CountdownSound | null {
  if (label === null) {
    return null;
  }
  return label === GO_LABEL ? 'go' : 'beep';
}

// The clock ticks through the last seconds of a question and stops as soon as I answered.
export function timerTick(secondsLeft: number | null, answered: boolean): TimerTick | null {
  if (answered || secondsLeft === null || secondsLeft <= 0) {
    return null;
  }
  if (secondsLeft > TIMER_WARNING_SECONDS) {
    return null;
  }
  return secondsLeft <= TIMER_URGENT_SECONDS ? 'urgent' : 'tick';
}

// The one sound a round result plays for me. Without an answer from me the round ended either
// because someone else got it first (party) or because the time ran out.
export function roundSound(
  round: RoundResultEvent,
  meId: string,
  mode: MatchMode,
): RoundSound | null {
  const mine = round.players.find((player) => player.userId === meId);
  if (!mine) {
    return null;
  }
  if (mine.correct) {
    return 'correct';
  }
  if (round.winnerUserId !== null) {
    return 'round-lost';
  }
  if (mine.optionIndex === null) {
    return 'time-up';
  }
  // A wrong answer in a party was already heard when it locked me out.
  return mode === 'PARTY' ? null : 'wrong';
}

export function isSameRound(a: RoundResultEvent, b: RoundResultEvent): boolean {
  return a.matchId === b.matchId && a.index === b.index;
}

// The tune of a finished match follows its headline. A solo game plinks its stars instead of
// a fanfare, so the two never play over each other.
export function endingSound(result: MatchResult, meId: string): EndingSound {
  const { tone } = resultHeadline(result, meId);
  if (tone !== 'victory') {
    return tone;
  }
  return result.mode === 'SOLO' ? 'stars' : 'victory';
}

// Each earned star plinks when its pop on the results screen is at its biggest.
export function starPlinkDelays(stars: number): number[] {
  return Array.from({ length: stars }, (_, index) => index * STAR_POP_DELAY_MS + STAR_POP_PEAK_MS);
}
