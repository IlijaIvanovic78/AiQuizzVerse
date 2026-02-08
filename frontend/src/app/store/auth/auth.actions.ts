import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  User,
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  TwoFARequiredResponse,
  Login2FARequest,
  Enable2FAResponse,
  Verify2FARequest,
} from '../../core/models';

/**
 * Auth Actions
 * All actions related to authentication flow.
 */
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    // ==================== REGISTER ====================
    'Register': props<{ credentials: RegisterRequest }>(),
    'Register Success': props<{ response: LoginResponse }>(),
    'Register Failure': props<{ error: string }>(),

    // ==================== LOGIN ====================
    'Login': props<{ credentials: LoginRequest }>(),
    'Login Success': props<{ response: LoginResponse }>(),
    'Login 2FA Required': props<{ response: TwoFARequiredResponse }>(),
    'Login Failure': props<{ error: string }>(),

    // ==================== 2FA LOGIN ====================
    'Login 2FA': props<{ request: Login2FARequest }>(),
    'Login 2FA Success': props<{ response: LoginResponse }>(),
    'Login 2FA Failure': props<{ error: string }>(),

    // ==================== REFRESH TOKEN ====================
    'Refresh Token': props<{ refreshToken: string }>(),
    'Refresh Token Success': props<{ accessToken: string; refreshToken: string }>(),
    'Refresh Token Failure': props<{ error: string }>(),

    // ==================== LOGOUT ====================
    'Logout': emptyProps(),
    'Logout Success': emptyProps(),

    // ==================== PROFILE ====================
    'Load Profile': emptyProps(),
    'Load Profile Success': props<{ user: User }>(),
    'Load Profile Failure': props<{ error: string }>(),

    // ==================== 2FA SETUP ====================
    'Enable 2FA': emptyProps(),
    'Enable 2FA Success': props<{ response: Enable2FAResponse }>(),
    'Enable 2FA Failure': props<{ error: string }>(),

    'Verify 2FA': props<{ request: Verify2FARequest }>(),
    'Verify 2FA Success': emptyProps(),
    'Verify 2FA Failure': props<{ error: string }>(),

    'Disable 2FA': emptyProps(),
    'Disable 2FA Success': emptyProps(),
    'Disable 2FA Failure': props<{ error: string }>(),

    // ==================== UI ====================
    'Clear Error': emptyProps(),
  },
});
