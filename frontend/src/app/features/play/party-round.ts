import { AttackType, MatchPlayerView } from '../../core/models/match.model';
import { SabotageBlock, SabotageHit } from '../../store/match/match.reducer';
import { MS_PER_SECOND, SABOTAGES } from './play.constants';

// When an effect on this player wears off, or 0 when it never hit them this round.
// A player can be hit by the same sabotage twice, so the later end wins.
export function effectEndsAt(hits: SabotageHit[], userId: string, type: AttackType): number {
  return hits
    .filter((hit) => hit.targetUserId === userId && hit.type === type)
    .reduce((latest, hit) => Math.max(latest, hit.landedAt + hit.durationMs), 0);
}

// The newest sabotage that still lasts on each player, like { owl: 'FREEZE' }.
// A scramble and a shield have no duration, so they never show up here.
export function lastingHits(hits: SabotageHit[], now: number): Record<string, AttackType> {
  const latest: Record<string, AttackType> = {};
  hits.forEach((hit) => {
    if (hit.type !== 'SHIELD' && hit.landedAt + hit.durationMs > now) {
      latest[hit.targetUserId] = hit.type;
    }
  });
  return latest;
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
  const from = hit.fromUserId === meId ? 'You' : (names[hit.fromUserId] ?? 'Someone');
  if (hit.type === 'SHIELD') {
    return `${from} raised a shield!`;
  }
  const { pastVerb, onMe } = SABOTAGES[hit.type];
  const target = hit.targetUserId === meId ? onMe : (names[hit.targetUserId] ?? 'a player');
  return `${from} ${pastVerb} ${target}!`;
}

// "Your shield blocked demo_friend's ink!", also told from the reader's point of view.
export function blockNotice(
  block: SabotageBlock,
  meId: string,
  names: Record<string, string>,
): string {
  const attack = SABOTAGES[block.type].label.toLowerCase();
  const attacker = names[block.fromUserId] ?? 'someone';
  if (block.targetUserId === meId) {
    return `Your shield blocked ${attacker}'s ${attack}!`;
  }
  const shield = `${names[block.targetUserId] ?? 'A player'}'s shield`;
  if (block.fromUserId === meId) {
    return `${shield} blocked your ${attack}!`;
  }
  return `${shield} blocked ${attacker}'s ${attack}!`;
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
