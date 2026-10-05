import { CanDeactivateFn } from '@angular/router';
import type { MatchPageComponent } from './match-page.component';

// Leaving /play/:matchId tells the server the player quit, so a running match asks first.
export const leaveMatchGuard: CanDeactivateFn<MatchPageComponent> = (page) => page.confirmLeave();
