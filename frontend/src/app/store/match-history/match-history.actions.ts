import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { MatchHistoryEntry } from '../../core/models/match.model';

export const MatchHistoryActions = createActionGroup({
  source: 'Match History',
  events: {
    Load: emptyProps(),
    Loaded: props<{ entries: MatchHistoryEntry[] }>(),
    Failed: props<{ error: string }>(),
  },
});
