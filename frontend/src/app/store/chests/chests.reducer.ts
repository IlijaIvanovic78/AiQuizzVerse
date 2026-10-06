import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { ChestOdds, ChestReward, ChestView } from '../../core/models/chest.model';
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
      }),
    ),
    on(ChestsActions.opened, (state, { chest, reward }) => withOpenedChest(state, chest, reward)),
    on(ChestsActions.openFailed, (state): ChestsState => ({ ...state, opening: null })),
    on(
      ChestsActions.revealClosed,
      (state): ChestsState => ({ ...state, opening: null, reveal: null }),
    ),
    on(ChestsActions.earned, (state, { chest }) => unopenedAdapter.addOne(chest, state)),
    // A list or odds request can fail while a chest is opening; the dialog stays open for it.
    on(
      ChestsActions.failed,
      (state, { error }): ChestsState => ({ ...state, loading: false, error }),
    ),
  ),
  extraSelectors: ({ selectChestsState }) => ({
    selectUnopenedChests: createSelector(selectChestsState, selectAll),
    selectUnopenedCount: createSelector(selectChestsState, selectTotal),
  }),
});

// Only the chest shown in the dialog gets its reward revealed.
function withOpenedChest(state: ChestsState, chest: ChestView, reward: ChestReward): ChestsState {
  const recent = [chest, ...state.recent.filter((old) => old.id !== chest.id)].slice(
    0,
    RECENT_CHESTS_LIMIT,
  );
  const isInDialog = state.opening?.id === chest.id;
  return unopenedAdapter.removeOne(chest.id, {
    ...state,
    recent,
    reveal: isInDialog ? reward : state.reveal,
  });
}
