import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ReviewDeck } from '../../core/models/review.model';

export const ReviewActions = createActionGroup({
  source: 'Review',
  events: {
    Load: emptyProps(),
    Loaded: props<{ deck: ReviewDeck }>(),
    Practice: props<{ questionIds: string[] }>(),
    'Practice Ready': props<{ quizId: string }>(),
    Failed: props<{ error: string }>(),
  },
});
