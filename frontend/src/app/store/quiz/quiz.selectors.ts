import { createFeatureSelector, createSelector } from '@ngrx/store';
import { QuizState } from './quiz.state';

// Feature selector
export const selectQuizState = createFeatureSelector<QuizState>('quiz');

// Quizzes list
export const selectQuizzes = createSelector(selectQuizState, (state) => state.quizzes);

export const selectQuizzesCount = createSelector(selectQuizzes, (quizzes) => quizzes.length);

// Current quiz (with questions)
export const selectCurrentQuiz = createSelector(selectQuizState, (state) => state.currentQuiz);

export const selectCurrentQuizQuestions = createSelector(
  selectCurrentQuiz,
  (quiz) => quiz?.questions ?? []
);

// Generation state
export const selectIsGenerating = createSelector(selectQuizState, (state) => state.generating);

// Upload state
export const selectIsUploading = createSelector(selectQuizState, (state) => state.uploading);

export const selectUploadedFileName = createSelector(
  selectQuizState,
  (state) => state.uploadedFileName
);

// Loading state
export const selectQuizLoading = createSelector(selectQuizState, (state) => state.loading);

// Error state
export const selectQuizError = createSelector(selectQuizState, (state) => state.error);

// Combined busy state (generating or uploading or loading)
export const selectQuizBusy = createSelector(
  selectQuizState,
  (state) => state.generating || state.uploading || state.loading
);
