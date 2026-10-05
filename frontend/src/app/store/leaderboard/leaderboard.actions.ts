import { createActionGroup, props } from '@ngrx/store';
import { Leaderboard, LeaderboardScope } from '../../core/models/leaderboard.model';

export const LeaderboardActions = createActionGroup({
  source: 'Leaderboard',
  events: {
    Load: props<{ scope: LeaderboardScope }>(),
    Loaded: props<{ leaderboard: Leaderboard }>(),
    Failed: props<{ error: string }>(),
  },
});
