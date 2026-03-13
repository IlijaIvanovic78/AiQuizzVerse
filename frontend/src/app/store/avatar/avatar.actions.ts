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
  },
});
