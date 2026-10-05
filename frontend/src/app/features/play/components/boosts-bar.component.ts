import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatchBoostType } from '../../../core/models/shop.model';
import { BoostIconComponent } from '../../../shared/components/boost-icon.component';

interface BoostLook {
  type: MatchBoostType;
  label: string;
  description: string;
}

const BOOSTS: BoostLook[] = [
  { type: 'HINT', label: 'Hint', description: 'Shows a clue that helps you think' },
  { type: 'FIFTY_FIFTY', label: '50/50', description: 'Removes two wrong answers' },
  { type: 'EXTRA_TIME', label: '+15 s', description: 'Adds 15 seconds to the timer' },
];

@Component({
  selector: 'app-boosts-bar',
  imports: [BoostIconComponent],
  templateUrl: './boosts-bar.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoostsBarComponent {
  // How many times each power-up can still be used, free hints included.
  readonly uses = input.required<Record<MatchBoostType, number>>();
  readonly freeHintsLeft = input(0);
  readonly usedThisRound = input<MatchBoostType[]>([]);
  // Power-ups work only while the question is open and not answered yet.
  readonly disabled = input(false);
  readonly used = output<MatchBoostType>();

  protected readonly boosts = computed(() =>
    BOOSTS.map((boost) => {
      const count = this.uses()[boost.type];
      const usedNow = this.usedThisRound().includes(boost.type);
      return {
        ...boost,
        count,
        usedNow,
        disabled: this.disabled() || usedNow || count === 0,
      };
    }),
  );
}
