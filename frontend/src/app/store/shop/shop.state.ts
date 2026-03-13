import { ShopItem, UserBoost } from '../../models';

export interface ShopState {
  items: ShopItem[];
  boosts: UserBoost[];
  loading: boolean;
  error: string | null;
}

export const initialShopState: ShopState = {
  items: [],
  boosts: [],
  loading: false,
  error: null,
};
