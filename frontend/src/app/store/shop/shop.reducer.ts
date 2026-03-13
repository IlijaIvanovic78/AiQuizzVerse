import { createReducer, on } from '@ngrx/store';
import { ShopActions } from './shop.actions';
import { initialShopState } from './shop.state';

export const shopReducer = createReducer(
  initialShopState,

  on(ShopActions.loadItems, (state) => ({ ...state, loading: true, error: null })),
  on(ShopActions.loadItemsSuccess, (state, { items }) => ({ ...state, items, loading: false })),
  on(ShopActions.loadItemsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ShopActions.buyItem, (state) => ({ ...state, loading: true, error: null })),
  on(ShopActions.buyItemSuccess, (state) => ({ ...state, loading: false })),
  on(ShopActions.buyItemFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ShopActions.buyBoost, (state) => ({ ...state, loading: true, error: null })),
  on(ShopActions.buyBoostSuccess, (state, { boost }) => {
    const idx = state.boosts.findIndex((b) => b.type === boost.type);
    const boosts = idx >= 0
      ? state.boosts.map((b, i) => (i === idx ? boost : b))
      : [...state.boosts, boost];
    return { ...state, boosts, loading: false };
  }),
  on(ShopActions.buyBoostFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ShopActions.loadBoosts, (state) => ({ ...state, loading: true })),
  on(ShopActions.loadBoostsSuccess, (state, { boosts }) => ({ ...state, boosts, loading: false })),
  on(ShopActions.loadBoostsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ShopActions.clearError, (state) => ({ ...state, error: null })),
);
