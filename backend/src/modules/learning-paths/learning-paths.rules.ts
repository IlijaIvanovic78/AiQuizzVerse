import { PathStepRequest } from '../ai/ai.types';
import { FIRST_STEP_POSITION, PATH_PLAN } from './learning-paths.constants';
import { PathRequest } from './learning-paths.types';

export function buildStepRequests(path: PathRequest): PathStepRequest[] {
  const stepFocuses = PATH_PLAN.map((step) => step.focus);
  return PATH_PLAN.map((step) => ({
    topic: path.topic,
    audience: path.audience,
    language: path.language,
    difficulty: step.difficulty,
    questionCount: step.questionCount,
    position: step.position,
    goal: step.goal,
    stepFocuses,
  }));
}

/** Steps are written at the same time, so a step only knows the goals of earlier steps. */
export function earlierStepGoals(position: number): string[] {
  return PATH_PLAN.filter((step) => step.position < position).map((step) => step.goal);
}

export function isStepUnlocked(position: number, previousStepCleared: boolean): boolean {
  return position === FIRST_STEP_POSITION || previousStepCleared;
}
