import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ShopItem, UserItem } from '../../models';

export interface AvatarState extends EntityState<UserItem> {
  equipped: UserItem | null;
  starters: ShopItem[];
  loading: boolean;
  error: string | null;
}

export const avatarAdapter: EntityAdapter<UserItem> = createEntityAdapter<UserItem>();

export const initialAvatarState: AvatarState = avatarAdapter.getInitialState({
  equipped: null,
  starters: [],
  loading: false,
  error: null,
});
