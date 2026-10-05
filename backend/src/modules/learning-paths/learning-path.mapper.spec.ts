import { PathDetailRow, toPathDetail, toPathSummary } from './learning-path.mapper';

const CLEARED_AT = new Date('2026-10-05T10:00:00Z');

function makeStep(position: number, stars: number, completedAt: Date | null) {
  return {
    id: `step-${position}`,
    pathId: 'path-1',
    position,
    title: `Step ${position}`,
    keyPoints: ['A short fact.'],
    difficulty: 'EASY' as const,
    quizId: `quiz-${position}`,
    stars,
    bestAccuracy: stars > 0 ? 80 : 0,
    completedAt,
    quiz: { _count: { questions: 5 } },
  };
}

function makePath(steps: PathDetailRow['steps'], documentId: string | null = null): PathDetailRow {
  return {
    id: 'path-1',
    ownerId: 'user-1',
    topic: 'Volcanoes',
    documentId,
    audience: 'KIDS',
    language: 'EN',
    createdAt: CLEARED_AT,
    steps,
  };
}

describe('toPathSummary', () => {
  it('counts cleared steps and stars and points to the first step not cleared', () => {
    const path = makePath([
      makeStep(1, 3, CLEARED_AT),
      makeStep(2, 1, CLEARED_AT),
      makeStep(3, 0, null),
      makeStep(4, 0, null),
      makeStep(5, 0, null),
    ]);

    const summary = toPathSummary(path);

    expect(summary).toMatchObject({ stepsCleared: 2, totalSteps: 5, stars: 4, maxStars: 15 });
    expect(summary.nextStep).toEqual({
      id: 'step-3',
      position: 3,
      title: 'Step 3',
      quizId: 'quiz-3',
    });
  });

  it('has no next step when every step is cleared', () => {
    const path = makePath([1, 2, 3, 4, 5].map((position) => makeStep(position, 2, CLEARED_AT)));

    expect(toPathSummary(path).nextStep).toBeNull();
  });
});

describe('toPathDetail', () => {
  it('unlocks a step only after the step before it is cleared', () => {
    const path = makePath([makeStep(1, 2, CLEARED_AT), makeStep(2, 0, null), makeStep(3, 0, null)]);

    const steps = toPathDetail(path).steps;

    expect(steps.map((step) => step.unlocked)).toEqual([true, true, false]);
    expect(steps.map((step) => step.cleared)).toEqual([true, false, false]);
  });

  it('shows the reward of every step and its question count', () => {
    const path = makePath([makeStep(1, 0, null), makeStep(5, 0, null)]);

    const [first, last] = toPathDetail(path).steps;

    expect(first.reward).toEqual({ coins: 20, chest: 'WOODEN' });
    expect(last.reward).toEqual({ coins: 60, chest: 'GOLDEN' });
    expect(first.questionCount).toBe(5);
  });

  it('marks paths made from a lesson PDF', () => {
    expect(toPathDetail(makePath([], 'document-1')).source).toBe('DOCUMENT');
    expect(toPathDetail(makePath([])).source).toBe('TOPIC');
  });
});
