import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Audience } from '../../../core/models/quiz.model';
import { ChoiceCardComponent } from '../../../shared/components/choice-card.component';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { AudienceLabelPipe } from '../../../shared/pipes/audience-label.pipe';
import { AUDIENCE_CHOICES } from '../create.constants';

@Component({
  selector: 'app-audience-picker',
  imports: [ChoiceCardComponent, HeroSpriteComponent, AudienceLabelPipe],
  templateUrl: './audience-picker.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudiencePickerComponent {
  readonly value = input.required<Audience>();
  readonly picked = output<Audience>();

  protected readonly choices = AUDIENCE_CHOICES;
}
