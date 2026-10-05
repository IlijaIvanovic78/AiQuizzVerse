import { GATE_LEFT_MAX, GATE_LEFT_MIN, GATE_RIGHT_MAX, GATE_RIGHT_MIN } from './shop.constants';

export interface GateQuestion {
  left: number;
  right: number;
  answer: number;
}

// `random` is passed in so the tests can pick the numbers.
export function createGateQuestion(random: () => number = Math.random): GateQuestion {
  const left = randomBetween(GATE_LEFT_MIN, GATE_LEFT_MAX, random);
  const right = randomBetween(GATE_RIGHT_MIN, GATE_RIGHT_MAX, random);
  return { left, right, answer: left * right };
}

export function isGateAnswerCorrect(question: GateQuestion, typed: string): boolean {
  const trimmed = typed.trim();
  return trimmed !== '' && Number(trimmed) === question.answer;
}

function randomBetween(min: number, max: number, random: () => number): number {
  return min + Math.floor(random() * (max - min + 1));
}
