import { MatchMode, MatchPlayerView } from '../../core/models/match.model';
import { RoundPlayerResult, RoundResultEvent } from '../../core/models/realtime-events.model';
import { HeroAction } from '../../shared/components/hero-sprite.component';

export interface ArenaFighter {
  id: string;
  name: string;
  heroKey: string | null;
  petKey: string | null;
  isMe: boolean;
  score: number;
  action: HeroAction;
  // Points that float above the hero after a correct answer.
  points: number | null;
  answered: boolean;
  away: boolean;
  // Party only: sabotage charges and what happened to the player in this round.
  charges: number;
  lockedOut: boolean;
  frozen: boolean;
  inked: boolean;
}

export interface FighterMoment {
  meId: string;
  scores: Record<string, number>;
  round: RoundResultEvent | null;
  answeredUserIds: string[];
  leftUserIds: string[];
  charges: Record<string, number>;
  lockedOutUserIds: string[];
  frozenUserIds: string[];
  inkedUserIds: string[];
}

export interface ArenaSides {
  left: ArenaFighter[];
  right: ArenaFighter[];
}

// The fighters come with the player first, and the player always stands on the left.
// A team shares the left platform, a duel rival stands on the right, and a party splits
// into two halves that face each other.
export function arenaSides(mode: MatchMode, fighters: ArenaFighter[]): ArenaSides {
  if (mode === 'TEAM') {
    return { left: fighters, right: [] };
  }
  if (mode === 'PARTY') {
    const half = Math.ceil(fighters.length / 2);
    return { left: fighters.slice(0, half), right: fighters.slice(half) };
  }
  return { left: fighters.slice(0, 1), right: fighters.slice(1, 2) };
}

export function toFighter(player: MatchPlayerView, moment: FighterMoment): ArenaFighter {
  const { user } = player;
  const roundResult = moment.round?.players.find((result) => result.userId === user.id) ?? null;
  const lockedOut = moment.lockedOutUserIds.includes(user.id);
  return {
    id: user.id,
    name: user.username,
    heroKey: user.avatarKey,
    petKey: user.petKey,
    isMe: user.id === moment.meId,
    score: moment.scores[user.id] ?? player.score,
    action: actionFor(roundResult, lockedOut),
    points: roundResult?.correct ? roundResult.points : null,
    answered: moment.answeredUserIds.includes(user.id),
    away: user.id !== moment.meId && moment.leftUserIds.includes(user.id),
    charges: moment.charges[user.id] ?? player.charges,
    lockedOut,
    frozen: moment.frozenUserIds.includes(user.id),
    inked: moment.inkedUserIds.includes(user.id),
  };
}

// A wrong party answer shakes the hero right away; everyone else waits for the round result.
function actionFor(roundResult: RoundPlayerResult | null, lockedOut: boolean): HeroAction {
  if (!roundResult) {
    return lockedOut ? 'hurt' : 'idle';
  }
  return roundResult.correct ? 'attack' : 'hurt';
}
