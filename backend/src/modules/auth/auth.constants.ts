export const BCRYPT_ROUNDS = 10;

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export const TWO_FACTOR_TOKEN_EXPIRATION = '5m';
export const TOTP_ISSUER = 'AI QuizVerse';
/**
 * Also accept the code from the 30 s step before and after,
 * so a phone clock that is slightly off still works.
 */
export const TOTP_WINDOW = 1;
export const TOTP_CODE_PATTERN = /^\d{6}$/;

export const AUTH_THROTTLE_LIMIT = 5;
export const AUTH_THROTTLE_TTL_MS = 60_000;
export const TOO_MANY_TRIES_MESSAGE = 'Too many tries. Wait a minute and try again.';

export const WRONG_CREDENTIALS_MESSAGE = 'Wrong email or password.';
export const WRONG_CODE_MESSAGE = 'That code did not work. Try the newest code from your app.';
export const TWO_FACTOR_ALREADY_ON_MESSAGE = 'Two-step login is already on.';
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
