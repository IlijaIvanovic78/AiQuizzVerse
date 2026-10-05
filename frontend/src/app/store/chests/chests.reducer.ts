import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { ChestOdds, ChestReward, ChestView } from '../../core/models/chest.model';
import { AuthActions } from '../auth/auth.actions';
import { ChestsActions } from './chests.actions';
import { RECENT_CHESTS_LIMIT } from './chests.constants';

// The entities are the chests still waiting to be opened.
interface ChestsState extends EntityState<ChestView> {
  recent: ChestView[];
  odds: ChestOdds | null;
  loaded: boolean;
  loading: boolean;
  // The chest in the opening dialog. It is kept here because opening removes it from the list.
  opening: ChestView | null;
  reveal: ChestReward | null;
  error: string | null;
}

const unopenedAdapter = createEntityAdapter<ChestView>({
  sortComparer: (a, b) => b.earnedAt.localeCompare(a.earnedAt),
});
const { selectAll, selectTotal } = unopenedAdapter.getSelectors();

const initialChestsState: ChestsState = unopenedAdapter.getInitialState({
  recent: [],
  odds: null,
  loaded: false,
  loading: false,
  opening: null,
  reveal: null,
  error: null,
});

export const chestsFeature = createFeature({
  name: 'chests',
  reducer: createReducer(
    initialChestsState,
    on(ChestsActions.load, (state): ChestsState => ({ ...state, loading: true, error: null })),
    on(
      ChestsActions.loaded,
      (state, { unopened, recent }): ChestsState =>
        unopenedAdapter.setAll(unopened, { ...state, recent, loaded: true, loading: false }),
    ),
    on(ChestsActions.oddsLoaded, (state, { odds }): ChestsState => ({ ...state, odds })),
    on(
      ChestsActions.open,
      (state, { chestId }): ChestsState => ({
        ...state,
        opening: state.entities[chestId] ?? null,
        reveal: null,
        error: null,
      }),
    ),
    on(ChestsActions.opened, (state, { chest, reward }) => withOpenedChest(state, chest, reward)),
    on(
      ChestsActions.revealClosed,
      (state): ChestsState => ({ ...state, opening: null, reveal: null }),
    ),
    on(ChestsActions.earned, (state, { chest }) => unopenedAdapter.addOne(chest, state)),
    on(
      ChestsActions.failed,
      (state, { error }): ChestsState => ({ ...state, loading: false, opening: null, error }),
    ),
    on(AuthActions.logout, AuthActions.sessionExpired, (): ChestsState => initialChestsState),
  ),
  extraSelectors: ({ selectChestsState }) => ({
    selectUnopenedChests: createSelector(selectChestsState, selectAll),
    selectUnopenedCount: createSelector(selectChestsState, selectTotal),
  }),
});

// The player may close the dialog before the server answers; the chest is opened all the same.
function withOpenedChest(state: ChestsState, chest: ChestView, reward: ChestReward): ChestsState {
  const recent = [chest, ...state.recent.filter((old) => old.id !== chest.id)].slice(
    0,
    RECENT_CHESTS_LIMIT,
  );
  const stillShown = state.opening?.id === chest.id;
  return unopenedAdapter.removeOne(chest.id, {
    ...state,
    recent,
    reveal: stillShown ? reward : state.reveal,
  });
}
