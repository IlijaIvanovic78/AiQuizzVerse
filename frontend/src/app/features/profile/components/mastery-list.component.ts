import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ThemeMastery } from '../../../core/models/profile.model';
import { BarTone, ProgressBarComponent } from '../../../shared/components/progress-bar.component';
import { ThemeLabelPipe } from '../../../shared/pipes/theme-label.pipe';
import { GOOD_ACCURACY, STRONG_ACCURACY } from '../profile.constants';

const FULL_PERCENT = 100;

@Component({
  selector: 'app-mastery-list',
  imports: [ProgressBarComponent, ThemeLabelPipe],
  templateUrl: './mastery-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasteryListComponent {
  readonly mastery = input.required<ThemeMastery[]>();

  // The themes with the most answers come first, because their numbers mean the most.
  protected readonly rows = computed(() =>
    [...this.mastery()]
      .sort((a, b) => b.answered - a.answered)
      .map((theme) => ({
        ...theme,
        fraction: theme.accuracy / FULL_PERCENT,
        tone: toneFor(theme.accuracy),
      })),
  );
}

function toneFor(accuracy: number): BarTone {
  if (accuracy >= STRONG_ACCURACY) {
    return 'jade';
  }
  return accuracy >= GOOD_ACCURACY ? 'torch' : 'ruby';
}
