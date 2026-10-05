import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PathSummary } from '../../../core/models/path.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { NEW_PATH_QUERY_PARAMS } from '../../create/create.constants';
import { SectionStatus } from '../home.types';

type StepState = 'cleared' | 'next' | 'locked';

const STEP_LOOKS: Record<StepState, { label: string; className: string }> = {
  cleared: { label: 'cleared', className: 'bg-torch-400 text-night-950' },
  next: { label: 'up next', className: 'bg-night-600 text-torch-300 !border-torch-400' },
  locked: { label: 'locked', className: 'bg-night-900 text-fog-400' },
};

@Component({
  selector: 'app-continue-path-card',
  imports: [RouterLink, PixelIconComponent, SpinnerComponent],
  templateUrl: './continue-path-card.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContinuePathCardComponent {
  // The newest path that still has a step to play, or null.
  readonly path = input.required<PathSummary | null>();
  readonly hasPaths = input.required<boolean>();
  readonly status = input.required<SectionStatus>();

  protected readonly newPathQuery = NEW_PATH_QUERY_PARAMS;
  protected readonly steps = computed(() => {
    const path = this.path();
    if (!path) {
      return [];
    }
    return Array.from({ length: path.totalSteps }, (_, index) => {
      const state = stepState(index + 1, path);
      return { position: index + 1, state, ...STEP_LOOKS[state] };
    });
  });
}

// Steps unlock one after another, so the first `stepsCleared` steps are the cleared ones.
function stepState(position: number, path: PathSummary): StepState {
  if (position <= path.stepsCleared) {
    return 'cleared';
  }
  return position === path.nextStep?.position ? 'next' : 'locked';
}
