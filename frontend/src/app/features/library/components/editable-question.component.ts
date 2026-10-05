import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QuestionView } from '../../../core/models/quiz.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';

// One question of a quiz on its parchment card. The right answer, hint and explanation stay
// hidden until the owner asks to see them.
@Component({
  selector: 'app-editable-question',
  imports: [PixelIconComponent],
  templateUrl: './editable-question.component.html',
  styleUrl: './editable-question.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableQuestionComponent {
  readonly question = input.required<QuestionView>();
  readonly number = input.required<number>();
  readonly showAnswers = input(false);
  readonly canDelete = input(true);
  readonly edit = output<void>();
  readonly remove = output<void>();
}
