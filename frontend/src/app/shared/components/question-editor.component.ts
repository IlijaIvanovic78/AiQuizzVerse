import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import {
  EXPLANATION_MAX_LENGTH,
  HINT_MAX_LENGTH,
  OPTION_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  QuestionForm,
  questionFormEvents,
  textProblem,
} from '../forms/quiz-form';
import { PixelIconComponent } from './pixel-icon.component';

interface QuestionProblems {
  text: string | null;
  options: (string | null)[];
  sameOptions: boolean;
  correctIndex: string | null;
  hint: string | null;
  explanation: string | null;
}

let nextEditorId = 0;

// Edits one question. The parent owns the form (see createQuestionForm), so the same editor
// works for a new quiz written by hand and for changing a question of a saved quiz.
@Component({
  selector: 'app-question-editor',
  imports: [ReactiveFormsModule, PixelIconComponent],
  templateUrl: './question-editor.component.html',
  styleUrl: './question-editor.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorComponent {
  readonly form = input.required<QuestionForm>();

  protected readonly id = `question-${++nextEditorId}`;
  protected readonly limits = {
    question: QUESTION_MAX_LENGTH,
    option: OPTION_MAX_LENGTH,
    hint: HINT_MAX_LENGTH,
    explanation: EXPLANATION_MAX_LENGTH,
  };

  // Form controls are not signals, so every form event refreshes the values the template reads.
  private readonly lastFormEvent = toSignal(
    toObservable(this.form).pipe(switchMap((form) => questionFormEvents(form))),
  );
  protected readonly problems = computed(() => {
    this.lastFormEvent();
    return findProblems(this.form());
  });
  protected readonly correctIndex = computed(() => {
    this.lastFormEvent();
    return this.form().controls.correctIndex.value;
  });
}

function findProblems(form: QuestionForm): QuestionProblems {
  const { text, options, correctIndex, hint, explanation } = form.controls;
  const anyOptionTouched = options.controls.some((option) => option.touched);
  return {
    text: textProblem(text, 'Write the question.'),
    options: options.controls.map((option, index) =>
      textProblem(option, `Write answer ${index + 1}.`),
    ),
    sameOptions: anyOptionTouched && options.hasError('sameOptions'),
    correctIndex: correctIndex.touched && correctIndex.invalid ? 'Pick the right answer.' : null,
    hint: textProblem(hint, 'Write a hint.'),
    explanation: textProblem(explanation, 'Write an explanation.'),
  };
}
