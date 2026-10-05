import { ChangeDetectionStrategy, Component, OnInit, computed, input, output } from '@angular/core';
import { QuestionInput, QuestionView } from '../../../core/models/quiz.model';
import { ModalComponent } from '../../../shared/components/modal.component';
import { QuestionEditorComponent } from '../../../shared/components/question-editor.component';
import { createQuestionForm, toQuestionInput } from '../../../shared/forms/quiz-form';

// Adds a new question (question is null) or changes an existing one.
@Component({
  selector: 'app-question-modal',
  imports: [ModalComponent, QuestionEditorComponent],
  template: `
    <app-modal size="lg" [title]="title()" [parchment]="true" (closed)="closed.emit()">
      <app-question-editor [form]="form" />
      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" class="btn btn-secondary" (click)="closed.emit()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="save()">Save question</button>
      </div>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionModalComponent implements OnInit {
  readonly question = input<QuestionView | null>(null);
  readonly number = input.required<number>();
  readonly saved = output<QuestionInput>();
  readonly closed = output<void>();

  protected readonly form = createQuestionForm();
  protected readonly title = computed(() =>
    this.question() ? `Edit question ${this.number()}` : `New question ${this.number()}`,
  );

  // Inputs are not set yet when fields are created, so the form is filled here.
  ngOnInit(): void {
    const question = this.question();
    if (question) {
      this.form.patchValue(question);
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(toQuestionInput(this.form));
  }
}
