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
    'Open Failed': props<{ error: string }>(),
    'Reveal Closed': emptyProps(),
    Earned: props<{ chest: ChestView }>(),
    'Visit Treasure Room': emptyProps(),
    // The chest list or the odds could not load. A failed opening has its own action above.
    Failed: props<{ error: string }>(),
  },
});
