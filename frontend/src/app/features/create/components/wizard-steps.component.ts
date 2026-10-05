import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { STEP_LABELS } from '../create.constants';
import { WizardStep } from '../create.types';

// The numbered trail above the wizard. Finished steps can be clicked to go back to them.
@Component({
  selector: 'app-wizard-steps',
  imports: [PixelIconComponent],
  templateUrl: './wizard-steps.component.html',
  styleUrl: './wizard-steps.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepsComponent {
  readonly steps = input.required<WizardStep[]>();
  readonly current = input.required<WizardStep>();
  readonly stepChosen = output<WizardStep>();

  protected readonly labels = STEP_LABELS;
  protected readonly currentIndex = computed(() => this.steps().indexOf(this.current()));
}
