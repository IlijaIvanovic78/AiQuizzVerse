import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { ShopItem } from '../../core/models/shop.model';
import { CurrentUser } from '../../core/models/user.model';
import { withUnlockedSabotage } from '../../shared/sabotages';
import { ChestsActions } from '../chests/chests.actions';
import { PaymentsActions } from '../shop/payments.actions';
import { ShopActions } from '../shop/shop.actions';
import { AuthActions } from './auth.actions';

type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  user: CurrentUser | null;
  status: AuthStatus;
  error: string | null;
  twoFactorToken: string | null;
  pending: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'unknown',
  error: null,
  twoFactorToken: null,
  pending: false,
};

const signedOutState: AuthState = { ...initialState, status: 'anonymous' };

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(
      AuthActions.login,
      AuthActions.register,
      AuthActions.submitTwoFactorCode,
      AuthActions.changeUsername,
      AuthActions.enableTwoFactor,
      AuthActions.disableTwoFactor,
      (state): AuthState => ({ ...state, pending: true, error: null }),
    ),
    on(
      AuthActions.twoFactorRequired,
      (state, { twoFactorToken }): AuthState => ({ ...state, pending: false, twoFactorToken }),
    ),
    on(
      AuthActions.twoFactorCancelled,
      (state): AuthState => ({ ...state, twoFactorToken: null, pending: false, error: null }),
    ),
    on(
      AuthActions.signedIn,
      AuthActions.sessionRestored,
      (_state, { user }): AuthState => ({ ...initialState, user, status: 'authenticated' }),
    ),
    on(
      AuthActions.signInFailed,
      AuthActions.settingsFailed,
      (state, { error }): AuthState => ({ ...state, pending: false, error }),
    ),
    on(
      AuthActions.sessionMissing,
      AuthActions.sessionExpired,
      AuthActions.logout,
      (): AuthState => signedOutState,
    ),
    on(
      AuthActions.usernameChanged,
      AuthActions.twoFactorChanged,
      (state, { user }): AuthState => ({ ...state, user, pending: false }),
    ),
    // A token refresh can happen in the middle of a settings save, so these only replace the user.
    on(
      AuthActions.tokensRefreshed,
      AuthActions.userRefreshed,
      ShopActions.itemEquipped,
      ShopActions.petUnequipped,
      ShopActions.starterClaimed,
      (state, { user }): AuthState => ({ ...state, user }),
    ),
    on(
      AuthActions.coinsUpdated,
      ShopActions.boostBought,
      PaymentsActions.purchaseConfirmed,
      (state, { coins }): AuthState => withCoins(state, coins),
    ),
    // A sabotage belongs to the hero, so the party sabotage bar shows a new one right away.
    on(
      ShopActions.itemBought,
      (state, { coins, item }): AuthState => withNewItem(withCoins(state, coins), item),
    ),
    on(
      ChestsActions.opened,
      (state, { coins, reward }): AuthState => withNewItem(withCoins(state, coins), reward.item),
    ),
  ),
  extraSelectors: ({ selectUser, selectStatus }) => ({
    selectIsAuthenticated: createSelector(selectStatus, (status) => status === 'authenticated'),
    selectCoins: createSelector(selectUser, (user) => user?.coins ?? 0),
  }),
});

function withCoins(state: AuthState, coins: number): AuthState {
  if (!state.user) {
    return state;
  }
  return { ...state, user: { ...state.user, coins } };
}

function withNewItem(state: AuthState, item: ShopItem | null): AuthState {
  if (!state.user || !item) {
    return state;
  }
  const sabotages = withUnlockedSabotage(state.user.sabotages, item);
  return { ...state, user: { ...state.user, sabotages } };
}
