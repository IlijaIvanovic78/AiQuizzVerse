import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatchMode } from '../../../core/models/match.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { ArenaFighter } from '../arena-fighter';

const EVEN_SHARE = 50;

@Component({
  selector: 'app-scoreboard',
  imports: [PixelIconComponent],
  templateUrl: './scoreboard.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreboardComponent {
  readonly mode = input.required<MatchMode>();
  // The first fighter is the player; in a duel the second one is the rival.
  readonly fighters = input.required<ArenaFighter[]>();
  readonly showAnswered = input(false);

  // In a duel the bar is a tug of war: the player's share of both scores.
  protected readonly myShare = computed(() => {
    const [me, rival] = this.fighters();
    const total = (me?.score ?? 0) + (rival?.score ?? 0);
    return total > 0 ? Math.round(((me?.score ?? 0) / total) * 100) : EVEN_SHARE;
  });
}
