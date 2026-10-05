import { OPTIONS_PER_QUESTION } from '../../common/quiz-shape.constants';
import { shuffle } from '../../common/utils/shuffle';
import { MAX_DROPPED_QUESTIONS, MIN_GENERATED_QUESTIONS } from './ai.constants';
import { GeneratedQuestion } from './ai.schemas';

export function usableQuestions(
  questions: GeneratedQuestion[],
  requestedCount: number,
): GeneratedQuestion[] {
  return questions.map(trimQuestion).filter(isUsableQuestion).slice(0, requestedCount);
}

/** A few broken questions may be dropped, but a quiz never gets shorter than the minimum. */
export function hasEnoughQuestions(usableCount: number, requestedCount: number): boolean {
  const minimum = Math.max(requestedCount - MAX_DROPPED_QUESTIONS, MIN_GENERATED_QUESTIONS);
  return usableCount >= minimum;
}

/** Correct answers go to every position about equally often, in random order. */
export function spreadCorrectAnswers(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  const correctSlots = shuffle(questions.map((_, index) => index % OPTIONS_PER_QUESTION));
  return questions.map((question, index) => moveCorrectOption(question, correctSlots[index]));
}

export function cleanKeyPoints(keyPoints: string[]): string[] {
  return keyPoints.map((point) => point.trim()).filter((point) => point.length > 0);
}

/** A step title that only repeats the step goal ("First steps") gets the topic added to it. */
export function specificStepTitle(title: string, goal: string, topic: string): string {
  const trimmed = title.trim();
  if (trimmed.length > 0 && toWordString(trimmed) !== toWordString(goal)) {
    return trimmed;
  }
  return `${goal}: ${topic}`;
}

/** True when the hint contains the whole correct answer as separate words. */
export function hintRevealsAnswer(hint: string, answer: string): boolean {
  const answerWords = toWordString(answer);
  return answerWords.trim().length > 0 && toWordString(hint).includes(answerWords);
}

function trimQuestion(question: GeneratedQuestion): GeneratedQuestion {
  return {
    text: question.text.trim(),
    options: question.options.map((option) => option.trim()),
    correctIndex: question.correctIndex,
    explanation: question.explanation.trim(),
    hint: question.hint.trim(),
  };
}

function isUsableQuestion(question: GeneratedQuestion): boolean {
  const { text, options, correctIndex, explanation, hint } = question;
  const hasText = text.length > 0 && explanation.length > 0 && hint.length > 0;
  const hasValidAnswer = correctIndex >= 0 && correctIndex < options.length;
  return (
    hasText &&
    hasDistinctOptions(options) &&
    hasValidAnswer &&
    !hintRevealsAnswer(hint, options[correctIndex])
  );
}

function hasDistinctOptions(options: string[]): boolean {
  const distinct = new Set(options.map((option) => option.toLowerCase()));
  return !options.includes('') && distinct.size === options.length;
}

function moveCorrectOption(question: GeneratedQuestion, slot: number): GeneratedQuestion {
  const correct = question.options[question.correctIndex];
  const wrong = shuffle(question.options.filter((_, index) => index !== question.correctIndex));
  return {
    ...question,
    options: [...wrong.slice(0, slot), correct, ...wrong.slice(slot)],
    correctIndex: slot,
  };
}

// The words are padded with spaces so that includes() only matches whole words.
// That is also why hintRevealsAnswer trims the answer before checking that it is not empty.
function toWordString(text: string): string {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
  return ` ${words.join(' ')} `;
}
