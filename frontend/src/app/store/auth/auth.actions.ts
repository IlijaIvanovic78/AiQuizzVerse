import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginRequest, RegisterRequest } from '../../core/models/auth.model';
import { CurrentUser } from '../../core/models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ credentials: LoginRequest }>(),
    Register: props<{ request: RegisterRequest }>(),
    'Two Factor Required': props<{ twoFactorToken: string }>(),
    'Submit Two Factor Code': props<{ code: string }>(),
    'Two Factor Cancelled': emptyProps(),
    'Signed In': props<{ user: CurrentUser }>(),
    'Sign In Failed': props<{ error: string }>(),
    'Session Restored': props<{ user: CurrentUser }>(),
    'Session Missing': emptyProps(),
    'Session Expired': emptyProps(),
    'Tokens Refreshed': props<{ user: CurrentUser }>(),
    Logout: emptyProps(),
    'Refresh User': emptyProps(),
    'User Refreshed': props<{ user: CurrentUser }>(),
    'Coins Updated': props<{ coins: number }>(),
    'Change Username': props<{ username: string }>(),
    'Username Changed': props<{ user: CurrentUser }>(),
    'Enable Two Factor': props<{ code: string }>(),
    'Disable Two Factor': props<{ code: string }>(),
    'Two Factor Changed': props<{ user: CurrentUser }>(),
    'Settings Failed': props<{ error: string }>(),
  },
});
