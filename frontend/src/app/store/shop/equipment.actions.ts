import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CurrentUser } from '../../core/models/user.model';

// Wearing a hero or a pet the player owns. The wardrobe on the profile and the chest reward
// dispatch these; the shop only sells the items.
export const EquipmentActions = createActionGroup({
  source: 'Equipment',
  events: {
    'Equip Item': props<{ itemId: string }>(),
    'Item Equipped': props<{ user: CurrentUser }>(),
    'Unequip Pet': emptyProps(),
    'Pet Unequipped': props<{ user: CurrentUser }>(),
    Failed: props<{ error: string }>(),
  },
});
