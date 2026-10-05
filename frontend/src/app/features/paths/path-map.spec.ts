import { StepView } from '../../core/models/path.model';
import {
  findNextStep,
  mapHeightRem,
  stopCenterY,
  trailSegmentPath,
  trailSegments,
} from './path-map';

function step(position: number, unlocked: boolean, cleared: boolean): StepView {
  return {
    id: `step-${position}`,
    position,
    title: `Step ${position}`,
    keyPoints: [],
    difficulty: 'EASY',
    quizId: `quiz-${position}`,
    questionCount: 5,
    stars: cleared ? 2 : 0,
    bestAccuracy: cleared ? 80 : 0,
    unlocked,
    cleared,
    reward: { coins: 20, boost: null },
  };
}

describe('path map', () => {
  const steps = [
    step(1, true, true),
    step(2, true, true),
    step(3, true, false),
    step(4, false, false),
  ];

  it('finds the first unlocked step that is not cleared yet', () => {
    expect(findNextStep(steps)?.id).toBe('step-3');
  });

  it('has no next step when every step is cleared', () => {
    expect(findNextStep([step(1, true, true), step(2, true, true)])).toBeNull();
  });

  it('gives the castle row extra height', () => {
    expect(mapHeightRem(5)).toBe(4 * 11 + 12.5);
    expect(mapHeightRem(0)).toBe(0);
  });

  it('puts the stop centre in the middle of its tile', () => {
    expect(stopCenterY(0, false)).toBe(0.75 + 2);
    expect(stopCenterY(4, true)).toBe(4 * 11 + 0.75 + 3);
  });

  it('draws a straight line when two stops share the same x', () => {
    expect(trailSegmentPath({ x: 50, y: 2 }, { x: 50, y: 12 })).toBe('M 50 2 C 50 2 50 2 50 12');
  });

  it('marks a segment as walked when the step it starts from is cleared', () => {
    const points = steps.map((_, index) => ({ x: 50, y: index * 10 }));

    expect(trailSegments(points, steps).map((segment) => segment.done)).toEqual([
      true,
      true,
      false,
    ]);
  });
});
