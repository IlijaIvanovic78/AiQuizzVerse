import { Observable, interval, map, of, take } from 'rxjs';
import { COUNTER_STEPS, COUNTER_TICK_MS } from './play.constants';

// Counts from 0 up to the target in a few quick steps, for the reward numbers on the results.
export function countUp(target: number): Observable<number> {
  const steps = Math.min(Math.abs(target), COUNTER_STEPS);
  if (steps === 0) {
    return of(target);
  }
  return interval(COUNTER_TICK_MS).pipe(
    take(steps),
    map((tick) => Math.round((target * (tick + 1)) / steps)),
  );
}
