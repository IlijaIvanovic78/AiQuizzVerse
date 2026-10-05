import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PathSummary } from '../../../core/models/path.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { NEW_PATH_QUERY_PARAMS, PATH_STEP_COUNT } from '../../create/create.constants';
import { TrailStepState, trailSteps } from '../../paths/path-map';
import { SectionStatus } from '../home.types';

const STEP_LOOKS: Record<TrailStepState, { label: string; className: string }> = {
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
  protected readonly pathStepCount = PATH_STEP_COUNT;
  protected readonly steps = computed(() => {
    const path = this.path();
    if (!path) {
      return [];
    }
    return trailSteps(path).map((step) => ({ ...step, ...STEP_LOOKS[step.state] }));
  });
}
