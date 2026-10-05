import { Leaderboard } from '../../core/models/leaderboard.model';
import { LeaderboardActions } from './leaderboard.actions';
import { leaderboardFeature } from './leaderboard.reducer';

const reducer = leaderboardFeature.reducer;

const friendsBoard: Leaderboard = {
  period: 'week',
  entries: [
    {
      rank: 1,
      user: {
        id: 'u1',
        username: 'archer_ana',
        avatarKey: 'mini-archer-man',
        petKey: null,
        level: 4,
      },
      weeklyXp: 120,
    },
  ],
  me: { rank: 2, weeklyXp: 80 },
};

function loadedFriendsBoard() {
  const loading = reducer(undefined, LeaderboardActions.load({ scope: 'friends' }));
  return reducer(loading, LeaderboardActions.loaded({ leaderboard: friendsBoard }));
}

describe('leaderboard reducer', () => {
  it('keeps the rows while the same board reloads', () => {
    const state = reducer(loadedFriendsBoard(), LeaderboardActions.load({ scope: 'friends' }));

    expect(state.entries).toEqual(friendsBoard.entries);
    expect(state.loaded).toBe(true);
  });

  it('clears the rows when switching to the other board', () => {
    const state = reducer(loadedFriendsBoard(), LeaderboardActions.load({ scope: 'global' }));

    expect(state.scope).toBe('global');
    expect(state.entries).toEqual([]);
    expect(state.me).toBeNull();
    expect(state.loaded).toBe(false);
  });

  it('remembers the error when the request fails', () => {
    const loading = reducer(undefined, LeaderboardActions.load({ scope: 'global' }));
    const state = reducer(loading, LeaderboardActions.failed({ error: 'Offline' }));

    expect(state.error).toBe('Offline');
  });
});
