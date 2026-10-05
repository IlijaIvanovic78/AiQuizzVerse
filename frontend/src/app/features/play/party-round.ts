import { MatchPlayerView, SabotageType } from '../../core/models/match.model';
import { SabotageHit } from '../../store/match/match.reducer';
import { MS_PER_SECOND } from './play.constants';

const SABOTAGE_VERBS: Record<SabotageType, string> = {
  INK: 'inked',
  FREEZE: 'froze',
  SCRAMBLE: 'scrambled',
};

// When an effect on this player wears off, or 0 when it never hit them this round.
// A player can be hit by the same sabotage twice, so the later end wins.
export function effectEndsAt(hits: SabotageHit[], userId: string, type: SabotageType): number {
  return hits
    .filter((hit) => hit.targetUserId === userId && hit.type === type)
    .reduce((latest, hit) => Math.max(latest, hit.landedAt + hit.durationMs), 0);
}

// Whole seconds left, rounded up, so a freeze shows 3, 2, 1 and then disappears.
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / MS_PER_SECOND));
}

// "demo_friend inked brave_owl!", told from the point of view of the player reading it.
export function sabotageNotice(
  hit: SabotageHit,
  meId: string,
  names: Record<string, string>,
): string {
  const verb = SABOTAGE_VERBS[hit.type];
  const from = hit.fromUserId === meId ? 'You' : (names[hit.fromUserId] ?? 'Someone');
  if (hit.targetUserId !== meId) {
    return `${from} ${verb} ${names[hit.targetUserId] ?? 'a player'}!`;
  }
  return hit.type === 'SCRAMBLE' ? `${from} scrambled your answers!` : `${from} ${verb} you!`;
}

// Only players who can still answer can be hit: not me, not away and not answered yet.
export function sabotageTargets(
  players: MatchPlayerView[],
  meId: string,
  answeredUserIds: string[],
  awayUserIds: string[],
): string[] {
  return players
    .map((player) => player.user.id)
    .filter(
      (userId) =>
        userId !== meId && !answeredUserIds.includes(userId) && !awayUserIds.includes(userId),
    );
}
