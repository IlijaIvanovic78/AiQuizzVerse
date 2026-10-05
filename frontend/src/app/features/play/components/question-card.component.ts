import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';

@Component({
  selector: 'app-question-card',
  imports: [PixelIconComponent],
  templateUrl: './question-card.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionCardComponent {
  readonly number = input.required<number>();
  readonly total = input.required<number>();
  readonly text = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly canReadAloud = input(false);
  readonly speaking = input(false);
  readonly readAloud = output<void>();
}
