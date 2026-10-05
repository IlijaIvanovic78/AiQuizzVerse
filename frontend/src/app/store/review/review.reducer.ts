import { createFeature, createReducer, on } from '@ngrx/store';
import { ReviewCardView } from '../../core/models/review.model';
import { ReviewActions } from './review.actions';

interface ReviewState {
  dueToday: number;
  total: number;
  cards: ReviewCardView[];
  loaded: boolean;
  loading: boolean;
  practicing: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  dueToday: 0,
  total: 0,
  cards: [],
  loaded: false,
  loading: false,
  practicing: false,
  error: null,
};

export const reviewFeature = createFeature({
  name: 'review',
  reducer: createReducer(
    initialState,
    on(ReviewActions.load, (state): ReviewState => ({ ...state, loading: true, error: null })),
    on(
      ReviewActions.loaded,
      (state, { deck }): ReviewState => ({
        ...state,
        dueToday: deck.dueToday,
        total: deck.total,
        cards: deck.cards,
        loaded: true,
        loading: false,
      }),
    ),
    on(ReviewActions.practice, (state): ReviewState => ({ ...state, practicing: true })),
    on(ReviewActions.practiceReady, (state): ReviewState => ({ ...state, practicing: false })),
    on(
      ReviewActions.failed,
      (state, { error }): ReviewState => ({ ...state, loading: false, practicing: false, error }),
    ),
  ),
});
