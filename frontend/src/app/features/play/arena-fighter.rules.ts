import { AttackType, MatchMode, MatchPlayerView } from '../../core/models/match.model';
import { RoundPlayerResult, RoundResultEvent } from '../../core/models/realtime-events.model';
import { PublicUser } from '../../core/models/user.model';
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
  // The sabotage that still lasts on this player, like FREEZE.
  activeSabotage: AttackType | null;
  shielded: boolean;
  // A sabotage just bounced off this player's shield.
  blocked: boolean;
}

export interface FighterMoment {
  meId: string;
  scores: Record<string, number>;
  round: RoundResultEvent | null;
  answeredUserIds: string[];
  leftUserIds: string[];
  charges: Record<string, number>;
  lockedOutUserIds: string[];
  activeSabotageByUserId: Record<string, AttackType>;
  shieldedUserIds: string[];
  blockedUserIds: string[];
}

export interface ArenaSides {
  left: ArenaFighter[];
  right: ArenaFighter[];
}

// The fighters come with the player first, and the player always stands on the left.
// A solo player and a team share the left platform; a party splits into two halves that face
// each other, so two players stand one on each side.
export function arenaSides(mode: MatchMode, fighters: ArenaFighter[]): ArenaSides {
  if (mode !== 'PARTY') {
    return { left: fighters, right: [] };
  }
  const half = Math.ceil(fighters.length / 2);
  return { left: fighters.slice(0, half), right: fighters.slice(half) };
}

// The fields every fighter has. The results screen uses it as it is; toFighter adds what
// happens to the hero in a running match.
export function baseFighter(
  user: PublicUser,
  score: number,
  meId: string,
  action: HeroAction,
): ArenaFighter {
  return {
    id: user.id,
    name: user.username,
    heroKey: user.avatarKey,
    petKey: user.petKey,
    isMe: user.id === meId,
    score,
    action,
    points: null,
    answered: false,
    away: false,
    charges: 0,
    lockedOut: false,
    activeSabotage: null,
    shielded: false,
    blocked: false,
  };
}

// A hero in a running match, with everything that happens to them at this moment.
export function toFighter(player: MatchPlayerView, moment: FighterMoment): ArenaFighter {
  const { user } = player;
  const roundResult = moment.round?.players.find((result) => result.userId === user.id) ?? null;
  const lockedOut = moment.lockedOutUserIds.includes(user.id);
  const score = moment.scores[user.id] ?? player.score;
  return {
    ...baseFighter(user, score, moment.meId, actionFor(roundResult, lockedOut)),
    points: roundResult?.correct ? roundResult.points : null,
    answered: moment.answeredUserIds.includes(user.id),
    away: user.id !== moment.meId && moment.leftUserIds.includes(user.id),
    charges: moment.charges[user.id] ?? player.charges,
    lockedOut,
    activeSabotage: moment.activeSabotageByUserId[user.id] ?? null,
    shielded: moment.shieldedUserIds.includes(user.id),
    blocked: moment.blockedUserIds.includes(user.id),
  };
}

// A wrong party answer shakes the hero right away; everyone else waits for the round result.
function actionFor(roundResult: RoundPlayerResult | null, lockedOut: boolean): HeroAction {
  if (!roundResult) {
    return lockedOut ? 'hurt' : 'idle';
  }
  return roundResult.correct ? 'attack' : 'hurt';
}
