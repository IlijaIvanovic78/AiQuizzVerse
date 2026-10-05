import { FormArray, FormControl } from '@angular/forms';
import { createQuestionForm, distinctOptions, textLength, toQuestionInput } from './quiz-form';

function optionsArray(values: string[]): FormArray<FormControl<string>> {
  return new FormArray(values.map((value) => new FormControl(value, { nonNullable: true })));
}

describe('quiz form rules', () => {
  it('trims text before checking its length', () => {
    const title = new FormControl('  ab  ', { validators: textLength(3, 80) });

    expect(title.errors).toEqual({ tooShort: 3 });

    title.setValue('   ');
    expect(title.errors).toEqual({ required: true });
  });

  it('finds options that are the same apart from case and spaces', () => {
    const options = optionsArray(['Mars', ' mars ', 'Venus', '']);

    expect(distinctOptions(options)).toEqual({ sameOptions: true });
  });

  it('does not count empty options as the same', () => {
    const options = optionsArray(['Mars', '', '', 'Venus']);

    expect(distinctOptions(options)).toBeNull();
  });

  it('needs the right answer to be picked', () => {
    const form = createQuestionForm();
    form.patchValue({
      text: 'Which planet is red?',
      options: ['Mars', 'Venus', 'Earth', 'Jupiter'],
      hint: 'Think of rust.',
      explanation: 'Iron dust makes Mars look red.',
    });

    expect(form.valid).toBe(false);

    form.controls.correctIndex.setValue(0);
    expect(form.valid).toBe(true);
  });

  it('sends trimmed text to the server', () => {
    const form = createQuestionForm();
    form.setValue({
      text: '  Which planet is red? ',
      options: [' Mars', 'Venus ', 'Earth', 'Jupiter'],
      correctIndex: 0,
      hint: ' Think of rust. ',
      explanation: 'Iron dust makes Mars look red. ',
    });

    expect(toQuestionInput(form)).toEqual({
      text: 'Which planet is red?',
      options: ['Mars', 'Venus', 'Earth', 'Jupiter'],
      correctIndex: 0,
      hint: 'Think of rust.',
      explanation: 'Iron dust makes Mars look red.',
    });
  });
});
