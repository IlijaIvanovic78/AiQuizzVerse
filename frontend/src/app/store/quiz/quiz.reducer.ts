import { createReducer, on } from '@ngrx/store';
import { QuizActions } from './quiz.actions';
import { initialQuizState } from './quiz.state';

export const quizReducer = createReducer(
  initialQuizState,

  // Generate Quiz
  on(QuizActions.generateQuiz, (state) => ({
    ...state,
    generating: true,
    error: null,
  })),
  on(QuizActions.generateQuizSuccess, (state, { quiz }) => ({
    ...state,
    generating: false,
    currentQuiz: quiz,
    // Prepend to quizzes list
    quizzes: [
      {
        id: quiz.id,
        title: quiz.title,
        theme: quiz.theme,
        difficulty: quiz.difficulty,
        numQuestions: quiz.numQuestions,
        timePerQuestion: quiz.timePerQuestion,
        sourceType: quiz.sourceType,
        createdAt: quiz.createdAt,
        _count: { questions: quiz.questions.length },
      },
      ...state.quizzes,
    ],
  })),
  on(QuizActions.generateQuizFailure, (state, { error }) => ({
    ...state,
    generating: false,
    error,
  })),

  // Upload PDF
  on(QuizActions.uploadPdf, (state) => ({
    ...state,
    uploading: true,
    error: null,
  })),
  on(QuizActions.uploadPdfSuccess, (state, { response }) => ({
    ...state,
    uploading: false,
    uploadedFileName: response.fileName,
  })),
  on(QuizActions.uploadPdfFailure, (state, { error }) => ({
    ...state,
    uploading: false,
    error,
  })),
  on(QuizActions.clearUploadedFile, (state) => ({
    ...state,
    uploadedFileName: null,
  })),

  // Load My Quizzes
  on(QuizActions.loadMyQuizzes, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(QuizActions.loadMyQuizzesSuccess, (state, { quizzes }) => ({
    ...state,
    quizzes,
    loading: false,
  })),
  on(QuizActions.loadMyQuizzesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Quiz Detail
  on(QuizActions.loadQuizDetail, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(QuizActions.loadQuizDetailSuccess, (state, { quiz }) => ({
    ...state,
    currentQuiz: quiz,
    loading: false,
  })),
  on(QuizActions.loadQuizDetailFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete Quiz
  on(QuizActions.deleteQuiz, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(QuizActions.deleteQuizSuccess, (state, { quizId }) => ({
    ...state,
    quizzes: state.quizzes.filter((q) => q.id !== quizId),
    currentQuiz: state.currentQuiz?.id === quizId ? null : state.currentQuiz,
    loading: false,
  })),
  on(QuizActions.deleteQuizFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // UI State
  on(QuizActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
  on(QuizActions.clearCurrentQuiz, (state) => ({
    ...state,
    currentQuiz: null,
  }))
);
