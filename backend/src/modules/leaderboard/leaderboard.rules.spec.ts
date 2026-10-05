import { rankPlayers } from './leaderboard.rules';
import { RankedPlayer } from './leaderboard.types';

function player(username: string, weeklyXp: number): RankedPlayer {
  return {
    user: { id: username, username, avatarKey: null, petKey: null, level: 1 },
    weeklyXp,
  };
}

describe('weekly leaderboard ranks', () => {
  it('puts the most XP first', () => {
    const entries = rankPlayers([player('ana', 40), player('bojan', 120), player('cica', 90)]);

    expect(entries.map((entry) => [entry.user.username, entry.rank])).toEqual([
      ['bojan', 1],
      ['cica', 2],
      ['ana', 3],
    ]);
  });

  it('gives the same rank for the same XP and skips the next one', () => {
    const entries = rankPlayers([
      player('dule', 40),
      player('bojan', 90),
      player('ana', 90),
      player('cica', 120),
    ]);

    expect(entries.map((entry) => [entry.user.username, entry.rank])).toEqual([
      ['cica', 1],
      ['ana', 2],
      ['bojan', 2],
      ['dule', 4],
    ]);
  });

  it('ranks players without XP together at the bottom', () => {
    const entries = rankPlayers([player('ana', 0), player('bojan', 0), player('cica', 10)]);

    expect(entries.map((entry) => entry.rank)).toEqual([1, 2, 2]);
  });
});
