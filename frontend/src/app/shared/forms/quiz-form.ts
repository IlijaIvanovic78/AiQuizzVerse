import {
  AbstractControl,
  ControlEvent,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable, merge } from 'rxjs';
import { QuestionInput } from '../../core/models/quiz.model';

export const MIN_QUESTIONS = 3;
export const MAX_QUESTIONS = 15;
export const QUIZ_TITLE_MIN_LENGTH = 3;
export const QUIZ_TITLE_MAX_LENGTH = 80;
export const TOPIC_MIN_LENGTH = 3;
export const TOPIC_MAX_LENGTH = 120;
export const MIN_TIME_PER_QUESTION = 15;
export const MAX_TIME_PER_QUESTION = 120;
export const TIME_STEP_SECONDS = 5;

const OPTIONS_PER_QUESTION = 4;
const QUESTION_MIN_LENGTH = 3;
// Answers, hints and explanations only have to be filled in.
const ANSWER_MIN_LENGTH = 1;
export const QUESTION_MAX_LENGTH = 300;
export const OPTION_MAX_LENGTH = 120;
export const HINT_MAX_LENGTH = 300;
export const EXPLANATION_MAX_LENGTH = 500;

const NO_CORRECT_OPTION = -1;

export type QuestionForm = FormGroup<{
  text: FormControl<string>;
  options: FormArray<FormControl<string>>;
  correctIndex: FormControl<number>;
  hint: FormControl<string>;
  explanation: FormControl<string>;
}>;

// The server trims text before it checks the length, so the form does the same.
export function textLength(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const length = String(control.value ?? '').trim().length;
    if (length === 0) {
      return { required: true };
    }
    if (length < min) {
      return { tooShort: min };
    }
    return length > max ? { tooLong: max } : null;
  };
}

// Options are compared like the server compares them: trimmed and ignoring case.
export function distinctOptions(control: AbstractControl<string[]>): ValidationErrors | null {
  const filled = control.value.map((option) => option.trim().toLowerCase()).filter(Boolean);
  return new Set(filled).size < filled.length ? { sameOptions: true } : null;
}

export function createQuestionForm(): QuestionForm {
  return new FormGroup({
    text: textControl(QUESTION_MIN_LENGTH, QUESTION_MAX_LENGTH),
    options: new FormArray(
      Array.from({ length: OPTIONS_PER_QUESTION }, () =>
        textControl(ANSWER_MIN_LENGTH, OPTION_MAX_LENGTH),
      ),
      { validators: distinctOptions },
    ),
    correctIndex: new FormControl(NO_CORRECT_OPTION, {
      nonNullable: true,
      validators: Validators.min(0),
    }),
    hint: textControl(ANSWER_MIN_LENGTH, HINT_MAX_LENGTH),
    explanation: textControl(ANSWER_MIN_LENGTH, EXPLANATION_MAX_LENGTH),
  });
}

export function toQuestionInput(form: QuestionForm): QuestionInput {
  const { text, options, correctIndex, hint, explanation } = form.getRawValue();
  return {
    text: text.trim(),
    options: options.map((option) => option.trim()),
    correctIndex,
    hint: hint.trim(),
    explanation: explanation.trim(),
  };
}

// markAllAsTouched() does not bubble up to the group, so every control is watched on its own.
export function questionFormEvents(form: QuestionForm): Observable<ControlEvent> {
  const { text, options, correctIndex, hint, explanation } = form.controls;
  return merge(
    form.events,
    text.events,
    options.events,
    ...options.controls.map((option) => option.events),
    correctIndex.events,
    hint.events,
    explanation.events,
  );
}

// Explains the first problem of a touched field, or returns null when there is nothing to say.
export function textProblem(control: AbstractControl, missingText: string): string | null {
  if (!control.touched || !control.errors) {
    return null;
  }
  if (control.errors['tooShort']) {
    return `Use at least ${control.errors['tooShort']} characters.`;
  }
  if (control.errors['tooLong']) {
    return `Use at most ${control.errors['tooLong']} characters.`;
  }
  return missingText;
}

function textControl(min: number, max: number): FormControl<string> {
  return new FormControl('', { nonNullable: true, validators: textLength(min, max) });
}
