export const BCRYPT_ROUNDS = 10;

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export const TWO_FACTOR_TOKEN_EXPIRATION = '5m';
export const TOTP_ISSUER = 'AI QuizVerse';
export const TOTP_WINDOW = 1;
export const TOTP_CODE_PATTERN = /^\d{6}$/;

export const WRONG_CREDENTIALS_MESSAGE = 'Wrong email or password.';
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
