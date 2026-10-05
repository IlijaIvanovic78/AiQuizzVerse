import { PathSummary, StepView } from '../../core/models/path.model';
import {
  CASTLE_ROW_REM,
  CASTLE_TILE_REM,
  STOP_ROW_REM,
  STOP_TILE_REM,
  STOP_TOP_REM,
} from './paths.constants';

// x is a percent of the map width, y is in rem from the top of the map.
interface TrailPoint {
  x: number;
  y: number;
}

export interface TrailSegment {
  d: string;
  done: boolean;
}

export type TrailStepState = 'cleared' | 'next' | 'locked';

// One stop of the small trail drawn on path cards.
interface TrailStep {
  position: number;
  state: TrailStepState;
}

export function findNextStep(steps: StepView[]): StepView | null {
  return steps.find((step) => step.unlocked && !step.cleared) ?? null;
}

export function mapHeightRem(stopCount: number): number {
  if (stopCount === 0) {
    return 0;
  }
  return (stopCount - 1) * STOP_ROW_REM + CASTLE_ROW_REM;
}

// The last stop is the castle, so only that row has the bigger tile.
export function stopCenterY(index: number, isCastle: boolean): number {
  const tileSize = isCastle ? CASTLE_TILE_REM : STOP_TILE_REM;
  return index * STOP_ROW_REM + STOP_TOP_REM + tileSize / 2;
}

// The road leaves a stop sideways and drops into the next one from above.
// When both stops share the same x it is simply a straight line down.
export function trailSegmentPath(from: TrailPoint, to: TrailPoint): string {
  return `M ${from.x} ${from.y} C ${to.x} ${from.y} ${to.x} ${from.y} ${to.x} ${to.y}`;
}

// A segment counts as walked once the step it starts from is cleared.
export function trailSegments(points: TrailPoint[], steps: StepView[]): TrailSegment[] {
  return points.slice(1).map((point, index) => ({
    d: trailSegmentPath(points[index], point),
    done: steps[index].cleared,
  }));
}

// Steps unlock one after another, so the first `stepsCleared` steps are the cleared ones.
export function trailSteps(path: PathSummary): TrailStep[] {
  return Array.from({ length: path.totalSteps }, (_, index) => {
    const position = index + 1;
    return { position, state: trailStepState(position, path) };
  });
}

function trailStepState(position: number, path: PathSummary): TrailStepState {
  if (position <= path.stepsCleared) {
    return 'cleared';
  }
  return position === path.nextStep?.position ? 'next' : 'locked';
}
