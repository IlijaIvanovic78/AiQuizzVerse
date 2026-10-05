export const ACCESS_TOKEN_KEY = 'quizverse.accessToken';
export const REFRESH_TOKEN_KEY = 'quizverse.refreshToken';

export const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/login/2fa',
  '/auth/register',
  '/auth/username-available',
  '/auth/refresh',
];

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const TWO_FACTOR_CODE_PATTERN = /^\d{6}$/;
export const USERNAME_CHECK_DEBOUNCE_MS = 400;
