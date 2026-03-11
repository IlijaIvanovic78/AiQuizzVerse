import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuizActions } from '../../../store/quiz/quiz.actions';
import {
  selectIsGenerating,
  selectIsUploading,
  selectUploadedFileName,
  selectCurrentQuiz,
  selectQuizError,
} from '../../../store/quiz/quiz.selectors';
import { Difficulty, GenerateQuizRequest } from '../../../models';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-quiz.component.html',
})
export class CreateQuizComponent implements OnInit {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  // Form fields
  topic = '';
  difficulty: Difficulty = 'MEDIUM';
  numQuestions = 10;
  timePerQuestion = 30;
  sourceType: 'prompt' | 'pdf' = 'prompt';

  // Dropdown options
  difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
  questionCounts = [5, 10, 15, 20];
  timeLimits = [15, 20, 30, 45, 60];

  // Store observables
  generating$ = this.store.select(selectIsGenerating);
  uploading$ = this.store.select(selectIsUploading);
  uploadedFileName$ = this.store.select(selectUploadedFileName);
  currentQuiz$ = this.store.select(selectCurrentQuiz);
  error$ = this.store.select(selectQuizError);

  // Local state
  showResult = false;

  ngOnInit(): void {
    // When quiz is generated, show results
    this.currentQuiz$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((quiz) => {
        if (quiz) {
          this.showResult = true;
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.sourceType = 'pdf';
      this.store.dispatch(QuizActions.uploadPdf({ file }));
    }
  }

  clearUploadedFile(): void {
    this.sourceType = 'prompt';
    this.store.dispatch(QuizActions.clearUploadedFile());
  }

  generate(): void {
    if (!this.topic.trim()) return;

    const request: GenerateQuizRequest = {
      topic: this.topic.trim(),
      difficulty: this.difficulty,
      numQuestions: this.numQuestions,
      timePerQuestion: this.timePerQuestion,
      sourceType: this.sourceType,
    };

    this.showResult = false;
    this.store.dispatch(QuizActions.generateQuiz({ request }));
  }

  resetForm(): void {
    this.topic = '';
    this.difficulty = 'MEDIUM';
    this.numQuestions = 10;
    this.timePerQuestion = 30;
    this.sourceType = 'prompt';
    this.showResult = false;
    this.store.dispatch(QuizActions.clearCurrentQuiz());
    this.store.dispatch(QuizActions.clearUploadedFile());
    this.store.dispatch(QuizActions.clearError());
  }

  get isFormValid(): boolean {
    return this.topic.trim().length > 0;
  }
}
