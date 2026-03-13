import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ShopItem, UserItem } from '../../models';

export const AvatarActions = createActionGroup({
  source: 'Avatar',
  events: {
    'Load Items': emptyProps(),
    'Load Items Success': props<{ items: UserItem[] }>(),
    'Load Items Failure': props<{ error: string }>(),

    'Load Equipped': emptyProps(),
    'Load Equipped Success': props<{ equipped: UserItem | null }>(),

    'Select Avatar': props<{ userItemId: string }>(),
    'Select Avatar Success': props<{ equipped: UserItem }>(),
    'Select Avatar Failure': props<{ error: string }>(),

    'Load Starters': emptyProps(),
    'Load Starters Success': props<{ starters: ShopItem[] }>(),

    'Select Starter': props<{ itemId: string }>(),
    'Select Starter Success': props<{ userItem: UserItem }>(),
    'Select Starter Failure': props<{ error: string }>(),

    'Clear Error': emptyProps(),

    'Load Pets': emptyProps(),
    'Load Pets Success': props<{ pets: UserItem[] }>(),
    'Load Pets Failure': props<{ error: string }>(),

    'Select Pet': props<{ userItemId: string }>(),
    'Select Pet Success': props<{ equipped: UserItem }>(),
    'Select Pet Failure': props<{ error: string }>(),

    'Unequip Pet': emptyProps(),
    'Unequip Pet Success': emptyProps(),
    'Unequip Pet Failure': props<{ error: string }>(),
  },
});
