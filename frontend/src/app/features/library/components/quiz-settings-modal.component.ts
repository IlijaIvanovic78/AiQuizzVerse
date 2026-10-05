import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UpdateQuizRequest } from '../../../core/models/quiz.model';
import { ModalComponent } from '../../../shared/components/modal.component';
import { NumberStepperComponent } from '../../../shared/components/number-stepper.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../../shared/forms/form-signals';
import {
  MAX_TIME_PER_QUESTION,
  MIN_TIME_PER_QUESTION,
  QUIZ_TITLE_MAX_LENGTH,
  QUIZ_TITLE_MIN_LENGTH,
  TIME_STEP_SECONDS,
  textLength,
} from '../../../shared/forms/quiz-form';

@Component({
  selector: 'app-quiz-settings-modal',
  imports: [ReactiveFormsModule, ModalComponent, NumberStepperComponent, PixelIconComponent],
  templateUrl: './quiz-settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizSettingsModalComponent implements OnInit {
  readonly quizTitle = input.required<string>();
  readonly timePerQuestion = input.required<number>();
  readonly saved = output<UpdateQuizRequest>();
  readonly closed = output<void>();

  protected readonly limits = {
    title: QUIZ_TITLE_MAX_LENGTH,
    minTime: MIN_TIME_PER_QUESTION,
    maxTime: MAX_TIME_PER_QUESTION,
    timeStep: TIME_STEP_SECONDS,
  };
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', textLength(QUIZ_TITLE_MIN_LENGTH, QUIZ_TITLE_MAX_LENGTH)],
  });
  protected readonly titleInvalid = touchedAndInvalid(this.form.controls.title);
  protected readonly time = linkedSignal(() => this.timePerQuestion());

  ngOnInit(): void {
    this.form.setValue({ title: this.quizTitle() });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit({ title: this.form.controls.title.value.trim(), timePerQuestion: this.time() });
  }
}
