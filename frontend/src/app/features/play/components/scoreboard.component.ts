import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { ArenaFighter } from '../arena-fighter.rules';

// The team scores under the arena; a party has its own scoreboard with targets and charges.
@Component({
  selector: 'app-scoreboard',
  imports: [PixelIconComponent],
  templateUrl: './scoreboard.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreboardComponent {
  // The player comes first.
  readonly fighters = input.required<ArenaFighter[]>();
  readonly showAnswered = input(false);
}
