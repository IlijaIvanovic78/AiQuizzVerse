// A missed question comes back after 1, 3 and 7 days; three right answers in a row master it.
export const REVIEW_INTERVAL_DAYS = [1, 3, 7];
export const REVIEWS_TO_MASTER = REVIEW_INTERVAL_DAYS.length;

// What the server puts in one practice quiz.
export const PRACTICE_MAX_QUESTIONS = 10;
export const PRACTICE_SECONDS_PER_QUESTION = 45;
