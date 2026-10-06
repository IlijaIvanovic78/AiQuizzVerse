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
      (state): AuthState => ({ ...state, pending: true, error: null }),
    ),
    // error belongs to the login and register forms; a settings error is shown as a toast.
    on(
      AuthActions.changeUsername,
      AuthActions.enableTwoFactor,
      AuthActions.disableTwoFactor,
      (state): AuthState => ({ ...state, pending: true }),
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
      (state, { error }): AuthState => ({ ...state, pending: false, error }),
    ),
    on(AuthActions.settingsFailed, (state): AuthState => ({ ...state, pending: false })),
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
      (state, { coins, item }): AuthState => withSabotageFrom(withCoins(state, coins), item),
    ),
    on(
      ChestsActions.opened,
      (state, { coins, reward }): AuthState =>
        withSabotageFrom(withCoins(state, coins), reward.item),
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

// Only a sabotage item adds to the player's sabotages; a hero or a pet leaves them as they are.
function withSabotageFrom(state: AuthState, item: ShopItem | null): AuthState {
  if (!state.user || !item) {
    return state;
  }
  const sabotages = withUnlockedSabotage(state.user.sabotages, item);
  return { ...state, user: { ...state.user, sabotages } };
}
