import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ShopItem, UserItem } from '../../models';

export interface AvatarState extends EntityState<UserItem> {
  equipped: UserItem | null;
  starters: ShopItem[];
  pets: UserItem[];
  equippedPet: UserItem | null;
  loading: boolean;
  error: string | null;
}

export const avatarAdapter: EntityAdapter<UserItem> = createEntityAdapter<UserItem>();

export const initialAvatarState: AvatarState = avatarAdapter.getInitialState({
  equipped: null,
  starters: [],
  pets: [],
  equippedPet: null,
  loading: false,
  error: null,
});
