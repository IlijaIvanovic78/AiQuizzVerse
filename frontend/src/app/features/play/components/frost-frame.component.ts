import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SabotageIconComponent } from '../../../shared/components/sabotage-icon.component';

// FREEZE sabotage: ice over the answer buttons with a countdown. The buttons themselves are
// disabled by the answer grid, because the server rejects answers until the ice melts.
// The arena banner already says who froze the player, so the ice is hidden from screen readers.
@Component({
  selector: 'app-frost-frame',
  imports: [SabotageIconComponent],
  templateUrl: './frost-frame.component.html',
  styleUrl: './frost-frame.component.css',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrostFrameComponent {
  readonly secondsLeft = input.required<number>();

  protected readonly corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}
