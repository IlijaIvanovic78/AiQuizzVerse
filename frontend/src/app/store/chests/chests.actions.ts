import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ChestOdds, ChestReward, ChestView } from '../../core/models/chest.model';

export const ChestsActions = createActionGroup({
  source: 'Chests',
  events: {
    Load: emptyProps(),
    Loaded: props<{ unopened: ChestView[]; recent: ChestView[] }>(),
    'Load Odds': emptyProps(),
    'Odds Loaded': props<{ odds: ChestOdds }>(),
    Open: props<{ chestId: string }>(),
    Opened: props<{ chest: ChestView; reward: ChestReward; coins: number }>(),
    'Reveal Closed': emptyProps(),
    Earned: props<{ chest: ChestView }>(),
    'Visit Treasure Room': emptyProps(),
    Failed: props<{ error: string }>(),
  },
});
