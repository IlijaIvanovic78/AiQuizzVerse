import { ChestReward, ChestView } from '../../core/models/chest.model';
import { ChestsActions } from './chests.actions';
import { RECENT_CHESTS_LIMIT } from './chests.constants';
import { chestsFeature } from './chests.reducer';

const reducer = chestsFeature.reducer;

const coins: ChestReward = { kind: 'COINS', coins: 30, boosts: [], item: null, duplicate: false };

function chest(id: string, earnedAt: string, changes: Partial<ChestView> = {}): ChestView {
  return {
    id,
    type: 'WOODEN',
    source: 'DAILY_MATCH',
    earnedAt,
    openedAt: null,
    reward: null,
    ...changes,
  };
}

const older = chest('older', '2026-10-01T10:00:00.000Z');
const newer = chest('newer', '2026-10-04T10:00:00.000Z', { type: 'GOLDEN', source: 'STREAK' });

function loaded() {
  return reducer(undefined, ChestsActions.loaded({ unopened: [older, newer], recent: [] }));
}

function opened(state: ReturnType<typeof loaded>, id: string) {
  const openedChest = { ...chest(id, older.earnedAt), openedAt: '2026-10-05T10:00:00.000Z' };
  return reducer(state, ChestsActions.opened({ chest: openedChest, reward: coins, coins: 530 }));
}

describe('chests reducer', () => {
  it('keeps the unopened chests newest first', () => {
    const state = loaded();

    expect(chestsFeature.selectUnopenedChests.projector(state).map(({ id }) => id)).toEqual([
      'newer',
      'older',
    ]);
    expect(chestsFeature.selectUnopenedCount.projector(state)).toBe(2);
  });

  it('adds a chest that arrives over the socket only once', () => {
    const earned = reducer(loaded(), ChestsActions.earned({ chest: older }));
    const fresh = chest('fresh', '2026-10-05T09:00:00.000Z');
    const state = reducer(earned, ChestsActions.earned({ chest: fresh }));

    expect(state.ids).toEqual(['fresh', 'newer', 'older']);
  });

  it('shows the chest being opened and waits for its reward', () => {
    const state = reducer(loaded(), ChestsActions.open({ chestId: 'older' }));

    expect(state.opening).toEqual(older);
    expect(state.reveal).toBeNull();
  });

  it('removes an opened chest, reveals its reward and lists it first in recent', () => {
    const opening = reducer(loaded(), ChestsActions.open({ chestId: 'older' }));

    const state = opened(opening, 'older');

    expect(state.ids).toEqual(['newer']);
    expect(state.reveal).toEqual(coins);
    expect(state.recent[0].id).toBe('older');
  });

  it('keeps the dialog open and reveals the reward when the list fails to load meanwhile', () => {
    const opening = reducer(loaded(), ChestsActions.open({ chestId: 'older' }));
    const listFailed = reducer(opening, ChestsActions.failed({ error: 'Server is busy.' }));

    const state = opened(listFailed, 'older');

    expect(state.opening?.id).toBe('older');
    expect(state.reveal).toEqual(coins);
  });

  it('keeps only the newest opened chests in recent', () => {
    const recent = Array.from({ length: RECENT_CHESTS_LIMIT }, (_, index) =>
      chest(`old-${index}`, older.earnedAt),
    );
    const full = reducer(undefined, ChestsActions.loaded({ unopened: [older], recent }));

    const state = opened(full, 'older');

    expect(state.recent.length).toBe(RECENT_CHESTS_LIMIT);
    expect(state.recent[0].id).toBe('older');
    expect(state.recent.at(-1)?.id).toBe(`old-${RECENT_CHESTS_LIMIT - 2}`);
  });

  it('closes the dialog when opening fails', () => {
    const opening = reducer(loaded(), ChestsActions.open({ chestId: 'older' }));

    const state = reducer(
      opening,
      ChestsActions.openFailed({ error: 'This chest is already open.' }),
    );

    expect(state.opening).toBeNull();
    expect(state.reveal).toBeNull();
  });
});
