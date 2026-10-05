import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { StepView } from '../../../core/models/path.model';
import { CHEST_ICONS, CHEST_NAMES } from '../../../shared/chests';
import { DifficultyBadgeComponent } from '../../../shared/components/difficulty-badge.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { StarRatingComponent } from '../../../shared/components/star-rating.component';
import { MAX_STARS_PER_STEP } from '../paths.constants';

@Component({
  selector: 'app-step-panel',
  imports: [DifficultyBadgeComponent, PixelIconComponent, StarRatingComponent],
  templateUrl: './step-panel.component.html',
  styleUrl: './step-panel.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepPanelComponent {
  readonly step = input.required<StepView>();
  readonly totalSteps = input.required<number>();
  // The dialog already shows the step title in its header.
  readonly showTitle = input(true);
  readonly canReadAloud = input(false);
  readonly speaking = input(false);
  readonly starting = input(false);
  readonly readAloud = output<void>();
  readonly takeQuiz = output<void>();

  protected readonly chestNames = CHEST_NAMES;
  protected readonly chestIcons = CHEST_ICONS;

  protected readonly quizButtonText = computed(() => {
    const step = this.step();
    if (!step.cleared) {
      return 'Take the quiz';
    }
    return step.stars < MAX_STARS_PER_STEP ? 'Play again for more stars' : 'Play again';
  });
}
