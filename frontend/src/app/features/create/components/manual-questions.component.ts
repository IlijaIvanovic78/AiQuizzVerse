import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { QuestionEditorComponent } from '../../../shared/components/question-editor.component';
import { MAX_QUESTIONS, MIN_QUESTIONS, QuestionForm } from '../../../shared/forms/quiz-form';

@Component({
  selector: 'app-manual-questions',
  imports: [PixelIconComponent, QuestionEditorComponent],
  templateUrl: './manual-questions.component.html',
  styleUrl: './manual-questions.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualQuestionsComponent {
  readonly questions = input.required<QuestionForm[]>();
  readonly added = output<void>();
  readonly removed = output<number>();

  protected readonly min = MIN_QUESTIONS;
  protected readonly max = MAX_QUESTIONS;
}
