import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BoostOffer, BoostType, ShopItem } from '../../core/models/shop.model';
import { CurrentUser } from '../../core/models/user.model';

export const ShopActions = createActionGroup({
  source: 'Shop',
  events: {
    'Load Items': emptyProps(),
    'Items Loaded': props<{ items: ShopItem[] }>(),
    'Buy Item': props<{ itemId: string }>(),
    'Item Bought': props<{ coins: number; item: ShopItem }>(),
    'Equip Item': props<{ itemId: string }>(),
    'Item Equipped': props<{ user: CurrentUser }>(),
    'Unequip Pet': emptyProps(),
    'Pet Unequipped': props<{ user: CurrentUser }>(),
    'Claim Starter': props<{ itemId: string }>(),
    'Starter Claimed': props<{ user: CurrentUser }>(),
    'Load Boosts': emptyProps(),
    'Boosts Loaded': props<{ boosts: BoostOffer[] }>(),
    'Buy Boost': props<{ boostType: BoostType }>(),
    'Boost Bought': props<{ coins: number; boost: BoostOffer }>(),
    Failed: props<{ error: string }>(),
  },
});
