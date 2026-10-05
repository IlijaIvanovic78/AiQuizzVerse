import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { QuestionView, QuizDetail, QuizSummary } from '../../core/models/quiz.model';
import { QuizProgress } from '../../core/models/realtime-events.model';
import { PathsActions } from '../paths/paths.actions';
import { toQuizSummary } from './quiz.mapper';
import { QuizzesActions } from './quizzes.actions';

export interface QuizzesState extends EntityState<QuizSummary> {
  loaded: boolean;
  loading: boolean;
  featured: QuizSummary[];
  detail: QuizDetail | null;
  saving: boolean;
  creating: boolean;
  created: QuizDetail | null;
  progress: QuizProgress | null;
  error: string | null;
}

const quizzesAdapter = createEntityAdapter<QuizSummary>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});
const { selectAll, selectEntities } = quizzesAdapter.getSelectors();

export const initialQuizzesState: QuizzesState = quizzesAdapter.getInitialState({
  loaded: false,
  loading: false,
  featured: [],
  detail: null,
  saving: false,
  creating: false,
  created: null,
  progress: null,
  error: null,
});

export const quizzesFeature = createFeature({
  name: 'quizzes',
  reducer: createReducer(
    initialQuizzesState,
    on(
      QuizzesActions.load,
      QuizzesActions.loadFeatured,
      (state): QuizzesState => ({ ...state, loading: true, error: null }),
    ),
    on(
      QuizzesActions.loaded,
      (state, { quizzes }): QuizzesState =>
        quizzesAdapter.setAll(quizzes, { ...state, loaded: true, loading: false }),
    ),
    on(
      QuizzesActions.featuredLoaded,
      (state, { quizzes }): QuizzesState => ({ ...state, featured: quizzes, loading: false }),
    ),
    on(
      QuizzesActions.loadDetail,
      (state, { quizId }): QuizzesState => ({
        ...state,
        detail: state.detail?.id === quizId ? state.detail : null,
        loading: true,
        error: null,
      }),
    ),
    on(
      QuizzesActions.detailLoaded,
      (state, { quiz }): QuizzesState => ({ ...state, detail: quiz, loading: false }),
    ),
    on(
      QuizzesActions.create,
      QuizzesActions.generate,
      (state): QuizzesState => ({ ...state, creating: true, created: null, progress: null }),
    ),
    on(
      QuizzesActions.created,
      (state, { quiz }): QuizzesState =>
        quizzesAdapter.addOne(toQuizSummary(quiz), { ...state, creating: false, created: quiz }),
    ),
    on(
      QuizzesActions.creationReset,
      (state): QuizzesState => ({ ...state, created: null, progress: null }),
    ),
    on(
      QuizzesActions.progressReceived,
      (state, { progress }): QuizzesState => ({ ...state, progress }),
    ),
    // quiz:progress is also sent while a learning path is written, so a new path starts clean.
    on(
      PathsActions.create,
      PathsActions.creationReset,
      (state): QuizzesState => ({ ...state, progress: null }),
    ),
    on(
      QuizzesActions.update,
      QuizzesActions.addQuestion,
      QuizzesActions.updateQuestion,
      QuizzesActions.deleteQuestion,
      QuizzesActions.delete,
      (state): QuizzesState => ({ ...state, saving: true, error: null }),
    ),
    on(
      QuizzesActions.updated,
      (state, { quiz }): QuizzesState =>
        quizzesAdapter.updateOne(
          { id: quiz.id, changes: toQuizSummary(quiz) },
          { ...state, detail: quiz, saving: false },
        ),
    ),
    on(QuizzesActions.questionAdded, (state, { quizId, question }) =>
      changeDetailQuestions(state, quizId, (questions) => [...questions, question]),
    ),
    on(QuizzesActions.questionUpdated, (state, { quizId, question }) =>
      changeDetailQuestions(state, quizId, (questions) =>
        questions.map((existing) => (existing.id === question.id ? question : existing)),
      ),
    ),
    on(QuizzesActions.questionDeleted, (state, { quizId, questionId }) =>
      changeDetailQuestions(state, quizId, (questions) =>
        questions.filter((question) => question.id !== questionId),
      ),
    ),
    on(
      QuizzesActions.deleted,
      (state, { quizId }): QuizzesState =>
        quizzesAdapter.removeOne(quizId, {
          ...state,
          detail: state.detail?.id === quizId ? null : state.detail,
          saving: false,
        }),
    ),
    on(
      QuizzesActions.failed,
      (state, { error }): QuizzesState => ({
        ...state,
        loading: false,
        saving: false,
        creating: false,
        error,
      }),
    ),
  ),
  extraSelectors: ({ selectQuizzesState }) => ({
    selectAllQuizzes: createSelector(selectQuizzesState, selectAll),
    selectQuizEntities: createSelector(selectQuizzesState, selectEntities),
  }),
});

function changeDetailQuestions(
  state: QuizzesState,
  quizId: string,
  change: (questions: QuestionView[]) => QuestionView[],
): QuizzesState {
  if (state.detail?.id !== quizId) {
    return { ...state, saving: false };
  }
  const questions = change(state.detail.questions);
  const detail = { ...state.detail, questions, questionCount: questions.length };
  return quizzesAdapter.updateOne(
    { id: quizId, changes: { questionCount: questions.length } },
    { ...state, detail, saving: false },
  );
}
