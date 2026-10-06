import { MatchHistoryActions } from './match-history.actions';
import { matchHistoryFeature } from './match-history.reducer';

const { reducer } = matchHistoryFeature;

describe('match history reducer', () => {
  it('keeps the error of a failed load until the next try', () => {
    const failed = reducer(
      undefined,
      MatchHistoryActions.failed({ error: "Can't reach the server. Check your connection." }),
    );

    const retried = reducer(failed, MatchHistoryActions.load());

    expect(failed.error).toBe("Can't reach the server. Check your connection.");
    expect(failed.loaded).toBe(false);
    expect(retried.error).toBeNull();
  });
});
