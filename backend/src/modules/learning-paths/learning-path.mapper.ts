import { PathStep, Prisma } from '@prisma/client';
import { MAX_STARS_PER_STEP, STEP_REWARDS } from './learning-paths.constants';
import { isStepUnlocked } from './learning-paths.rules';
import { NextPathStep, PathDetail, PathSummary, StepView } from './learning-paths.types';

export const PATH_SUMMARY_INCLUDE = {
  steps: { orderBy: { position: 'asc' } },
} satisfies Prisma.LearningPathInclude;

export const PATH_DETAIL_INCLUDE = {
  steps: {
    orderBy: { position: 'asc' },
    include: { quiz: { select: { _count: { select: { questions: true } } } } },
  },
} satisfies Prisma.LearningPathInclude;

export type PathSummaryRow = Prisma.LearningPathGetPayload<{
  include: typeof PATH_SUMMARY_INCLUDE;
}>;
export type PathDetailRow = Prisma.LearningPathGetPayload<{ include: typeof PATH_DETAIL_INCLUDE }>;
type StepDetailRow = PathDetailRow['steps'][number];

export function toPathSummary(path: PathSummaryRow): PathSummary {
  const nextStep = path.steps.find((step) => !isCleared(step));
  return {
    id: path.id,
    topic: path.topic,
    audience: path.audience,
    language: path.language,
    stepsCleared: path.steps.filter(isCleared).length,
    totalSteps: path.steps.length,
    stars: path.steps.reduce((sum, step) => sum + step.stars, 0),
    maxStars: path.steps.length * MAX_STARS_PER_STEP,
    nextStep: nextStep ? toNextPathStep(nextStep) : null,
    createdAt: path.createdAt,
  };
}

export function toPathDetail(path: PathDetailRow): PathDetail {
  return {
    id: path.id,
    topic: path.topic,
    audience: path.audience,
    language: path.language,
    source: path.documentId ? 'DOCUMENT' : 'TOPIC',
    createdAt: path.createdAt,
    steps: path.steps.map((step, index) => toStepView(step, path.steps[index - 1])),
  };
}

function toStepView(step: StepDetailRow, previous: StepDetailRow | undefined): StepView {
  return {
    id: step.id,
    position: step.position,
    title: step.title,
    keyPoints: step.keyPoints,
    difficulty: step.difficulty,
    quizId: step.quizId,
    questionCount: step.quiz._count.questions,
    stars: step.stars,
    bestAccuracy: step.bestAccuracy,
    unlocked: isStepUnlocked(step.position, previous !== undefined && isCleared(previous)),
    cleared: isCleared(step),
    reward: STEP_REWARDS[step.position],
  };
}

function toNextPathStep(step: PathStep): NextPathStep {
  return { id: step.id, position: step.position, title: step.title, quizId: step.quizId };
}

function isCleared(step: PathStep): boolean {
  return step.completedAt !== null;
}
