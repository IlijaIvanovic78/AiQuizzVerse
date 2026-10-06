import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map } from 'rxjs';

// The same widths as Tailwind's md and lg breakpoints.
export const TABLET_UP = '(min-width: 768px)';
export const DESKTOP_UP = '(min-width: 1024px)';

// Players who turned animations off in their system settings.
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Sprites scale by whole pixels only, so some sizes are picked in code instead of in CSS.
// Call it in a field initializer, because toSignal needs an injection context.
export function screenMatches(query: string): Signal<boolean> {
  const mediaQuery = window.matchMedia(query);
  return toSignal(
    fromEvent<MediaQueryListEvent>(mediaQuery, 'change').pipe(map((event) => event.matches)),
    { initialValue: mediaQuery.matches },
  );
}
