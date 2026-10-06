import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { ChoiceCardComponent } from '../../../shared/components/choice-card.component';
import { itemIconUrl } from '../../../shared/icons';
import { PATH_STEP_COUNT } from '../../paths/paths.constants';
import { DAILY_CREATION_LIMIT, KIND_CHOICES } from '../create.constants';
import { CreateKind } from '../create.types';

// Wizard step 2 for the quiz master: one quick quiz or a whole learning path.
@Component({
  selector: 'app-make-step',
  imports: [ChoiceCardComponent],
  templateUrl: './make-step.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MakeStepComponent {
  readonly kind = model.required<CreateKind>();

  protected readonly choices = KIND_CHOICES;
  protected readonly itemIconUrl = itemIconUrl;
  protected readonly pathCost = PATH_STEP_COUNT;
  protected readonly dailyLimit = DAILY_CREATION_LIMIT;
}
