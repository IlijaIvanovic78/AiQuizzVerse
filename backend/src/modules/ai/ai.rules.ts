import { ServiceUnavailableException } from '@nestjs/common';
import { shuffle } from '../../common/utils/shuffle';
import {
  AI_WEAK_QUIZ_MESSAGE,
  MAX_DROPPED_QUESTIONS,
  MAX_KEY_POINTS,
  MIN_GENERATED_QUESTIONS,
  OPTIONS_PER_QUESTION,
} from './ai.constants';
import { GeneratedQuestion } from './ai.schemas';

export function validateAndShuffle(
  questions: GeneratedQuestion[],
  requestedCount: number,
  random: () => number = Math.random,
): GeneratedQuestion[] {
  const valid = questions.map(trimQuestion).filter(isUsableQuestion).slice(0, requestedCount);
  const minimum = Math.max(requestedCount - MAX_DROPPED_QUESTIONS, MIN_GENERATED_QUESTIONS);
  if (valid.length < minimum) {
    throw new ServiceUnavailableException(AI_WEAK_QUIZ_MESSAGE);
  }

  const correctSlots = spreadCorrectSlots(valid.length, random);
  return valid.map((question, index) => moveCorrectOption(question, correctSlots[index], random));
}

export function cleanKeyPoints(keyPoints: string[]): string[] {
  return keyPoints
    .map((point) => point.trim())
    .filter((point) => point.length > 0)
    .slice(0, MAX_KEY_POINTS);
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
  const hasValidAnswer =
    Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < options.length;
  return (
    hasText &&
    hasDistinctOptions(options) &&
    hasValidAnswer &&
    !hintRevealsAnswer(hint, options[correctIndex])
  );
}

function hasDistinctOptions(options: string[]): boolean {
  const distinct = new Set(options.map((option) => option.toLowerCase()));
  return (
    options.length === OPTIONS_PER_QUESTION &&
    !options.includes('') &&
    distinct.size === options.length
  );
}

/** Correct answers go to every position about equally often, in random order. */
function spreadCorrectSlots(count: number, random: () => number): number[] {
  const slots = Array.from({ length: count }, (_, index) => index % OPTIONS_PER_QUESTION);
  return shuffle(slots, random);
}

function moveCorrectOption(
  question: GeneratedQuestion,
  slot: number,
  random: () => number,
): GeneratedQuestion {
  const correct = question.options[question.correctIndex];
  const wrong = shuffle(
    question.options.filter((_, index) => index !== question.correctIndex),
    random,
  );
  return {
    ...question,
    options: [...wrong.slice(0, slot), correct, ...wrong.slice(slot)],
    correctIndex: slot,
  };
}

function toWordString(text: string): string {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
  return ` ${words.join(' ')} `;
}
