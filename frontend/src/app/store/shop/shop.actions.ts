import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ShopItem, UserItem, UserBoost, BoostType } from '../../models';

export const ShopActions = createActionGroup({
  source: 'Shop',
  events: {
    'Load Items': emptyProps(),
    'Load Items Success': props<{ items: ShopItem[] }>(),
    'Load Items Failure': props<{ error: string }>(),

    'Buy Item': props<{ itemId: string }>(),
    'Buy Item Success': props<{ userItem: UserItem }>(),
    'Buy Item Failure': props<{ error: string }>(),

    'Buy Boost': props<{ boostType: BoostType }>(),
    'Buy Boost Success': props<{ boost: UserBoost }>(),
    'Buy Boost Failure': props<{ error: string }>(),

    'Load Boosts': emptyProps(),
    'Load Boosts Success': props<{ boosts: UserBoost[] }>(),
    'Load Boosts Failure': props<{ error: string }>(),

    'Clear Error': emptyProps(),
  },
});
