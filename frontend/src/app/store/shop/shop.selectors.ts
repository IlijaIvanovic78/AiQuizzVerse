import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ShopState } from './shop.state';

export const selectShopState = createFeatureSelector<ShopState>('shop');

export const selectShopItems = createSelector(selectShopState, (s) => s.items);
export const selectShopBoosts = createSelector(selectShopState, (s) => s.boosts);
export const selectShopLoading = createSelector(selectShopState, (s) => s.loading);
export const selectShopError = createSelector(selectShopState, (s) => s.error);
