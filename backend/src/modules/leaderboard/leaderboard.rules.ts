import { LeaderboardEntry, RankedPlayer } from './leaderboard.types';

function byXpThenName(first: RankedPlayer, second: RankedPlayer): number {
  if (first.weeklyXp !== second.weeklyXp) {
    return second.weeklyXp - first.weeklyXp;
  }
  return first.user.username.localeCompare(second.user.username);
}

/** Players with the same XP share a rank: 120, 90, 90, 40 XP get ranks 1, 2, 2, 4. */
export function rankPlayers(players: RankedPlayer[]): LeaderboardEntry[] {
  const sorted = [...players].sort(byXpThenName);
  const sortedXp = sorted.map((player) => player.weeklyXp);
  return sorted.map((player) => ({ rank: sortedXp.indexOf(player.weeklyXp) + 1, ...player }));
}
