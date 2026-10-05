import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { QuizSummary, QuizTheme } from '../../core/models/quiz.model';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { PlayChoice, PlayModalComponent } from '../../shared/components/play-modal.component';
import { QuizCardComponent } from '../../shared/components/quiz-card.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { FriendsActions } from '../../store/friends/friends.actions';
import { friendsFeature } from '../../store/friends/friends.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { QuizzesActions } from '../../store/quizzes/quizzes.actions';
import { quizzesFeature } from '../../store/quizzes/quizzes.reducer';
import { ThemeFilterComponent } from './components/theme-filter.component';
import { countByTheme, filterQuizzes, notInLibrary } from './quiz-filters';

@Component({
  selector: 'app-library-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    EmptyStateComponent,
    PageHeaderComponent,
    PixelIconComponent,
    PlayModalComponent,
    QuizCardComponent,
    SpinnerComponent,
    ThemeFilterComponent,
  ],
  templateUrl: './library-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPageComponent {
  private readonly store = inject(Store);

  protected readonly quizzes = this.store.selectSignal(quizzesFeature.selectAllQuizzes);
  protected readonly loaded = this.store.selectSignal(quizzesFeature.selectLoaded);
  protected readonly error = this.store.selectSignal(quizzesFeature.selectError);
  protected readonly onlineFriends = this.store.selectSignal(friendsFeature.selectOnlineFriends);
  protected readonly friendsLoading = this.store.selectSignal(friendsFeature.selectLoading);
  protected readonly startingMatch = this.store.selectSignal(matchFeature.selectBusy);
  private readonly allFeatured = this.store.selectSignal(quizzesFeature.selectFeatured);

  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly searchText = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly theme = signal<QuizTheme | null>(null);
  protected readonly playing = signal<QuizSummary | null>(null);

  protected readonly themeCounts = computed(() => countByTheme(this.quizzes()));
  protected readonly shownQuizzes = computed(() =>
    filterQuizzes(this.quizzes(), this.searchText(), this.theme()),
  );
  protected readonly featured = computed(() => notInLibrary(this.allFeatured(), this.quizzes()));
  protected readonly emptyText = computed(() =>
    this.featured().length > 0
      ? 'Make your first quiz from any topic or PDF lesson, or try a featured quest below.'
      : 'Make your first quiz from any topic or PDF lesson.',
  );

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.store.dispatch(QuizzesActions.load());
    this.store.dispatch(QuizzesActions.loadFeatured());
  }

  protected clearFilters(): void {
    this.search.setValue('');
    this.theme.set(null);
  }

  protected openPlay(quiz: QuizSummary): void {
    this.playing.set(quiz);
    this.store.dispatch(FriendsActions.load());
  }

  protected play(quiz: QuizSummary, choice: PlayChoice): void {
    this.store.dispatch(MatchActions.create({ request: { quizId: quiz.id, ...choice } }));
  }
}
