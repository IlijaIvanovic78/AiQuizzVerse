import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { HeroSpriteComponent } from '../../shared/components/hero-sprite.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { authFeature } from '../../store/auth/auth.reducer';
import { matchFeature } from '../../store/match/match.reducer';
import { ReviewActions } from '../../store/review/review.actions';
import { reviewFeature } from '../../store/review/review.reducer';
import { ReviewCardComponent } from './components/review-card.component';
import {
  PRACTICE_MAX_QUESTIONS,
  PRACTICE_SECONDS_PER_QUESTION,
  REVIEW_INTERVAL_DAYS,
} from './review.constants';

@Component({
  selector: 'app-review-page',
  imports: [
    RouterLink,
    EmptyStateComponent,
    HeroSpriteComponent,
    PageHeaderComponent,
    RelativeTimePipe,
    ReviewCardComponent,
    SpinnerComponent,
  ],
  templateUrl: './review-page.component.html',
  styleUrl: './review-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPageComponent {
  private readonly store = inject(Store);

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly dueToday = this.store.selectSignal(reviewFeature.selectDueToday);
  protected readonly total = this.store.selectSignal(reviewFeature.selectTotal);
  protected readonly cards = this.store.selectSignal(reviewFeature.selectCards);
  protected readonly loaded = this.store.selectSignal(reviewFeature.selectLoaded);
  protected readonly error = this.store.selectSignal(reviewFeature.selectError);
  private readonly practicing = this.store.selectSignal(reviewFeature.selectPracticing);
  private readonly creatingMatch = this.store.selectSignal(matchFeature.selectBusy);

  protected readonly intervals = REVIEW_INTERVAL_DAYS;
  protected readonly practiceSize = PRACTICE_MAX_QUESTIONS;
  protected readonly practiceSeconds = PRACTICE_SECONDS_PER_QUESTION;
  // Practice first builds the review quiz, then opens a solo match on it.
  protected readonly starting = computed(() => this.practicing() || this.creatingMatch());
  // Cards come due first, so the first card is the next one to review.
  protected readonly nextDueOn = computed(() => this.cards()[0]?.dueOn ?? null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.store.dispatch(ReviewActions.load());
  }

  protected practice(): void {
    this.store.dispatch(ReviewActions.practice({ questionIds: [] }));
  }
}
