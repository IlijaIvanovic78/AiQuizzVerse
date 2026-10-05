export const QUIZ_MODEL = 'gpt-4.1-mini';
export const WRITER_TEMPERATURE = 0.7;
export const REVIEWER_TEMPERATURE = 0;
export const AI_TIMEOUT_MS = 60_000;
export const AI_MAX_RETRIES = 2;

export const MIN_GENERATED_QUESTIONS = 3;
export const MAX_DROPPED_QUESTIONS = 2;
export const MIN_KEY_POINTS = 3;
export const MAX_KEY_POINTS = 5;

export const AI_RESTING_MESSAGE = 'The quiz master is resting. Try again in a moment.';
export const AI_WEAK_QUIZ_MESSAGE =
  'The quiz master could not write enough good questions. Please try again.';
