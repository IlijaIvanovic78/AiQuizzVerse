import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CreateMatchRequest } from '../../core/models/match.model';
import { QuizSummary } from '../../core/models/quiz.model';
import { PublicUser } from '../../core/models/user.model';
import { InviteToPlayDialogComponent } from '../../shared/components/invite-to-play-dialog.component';
import { PlayChoice, PlayModalComponent } from '../../shared/components/play-modal.component';
import { QuizCardComponent } from '../../shared/components/quiz-card.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { authFeature } from '../../store/auth/auth.reducer';
import { ChestsActions } from '../../store/chests/chests.actions';
import { chestsFeature } from '../../store/chests/chests.reducer';
import { FriendsActions } from '../../store/friends/friends.actions';
import { friendsFeature } from '../../store/friends/friends.reducer';
import { LeaderboardActions } from '../../store/leaderboard/leaderboard.actions';
import { leaderboardFeature } from '../../store/leaderboard/leaderboard.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { PathsActions } from '../../store/paths/paths.actions';
import { pathsFeature } from '../../store/paths/paths.reducer';
import { QuizzesActions } from '../../store/quizzes/quizzes.actions';
import { quizzesFeature } from '../../store/quizzes/quizzes.reducer';
import { ReviewActions } from '../../store/review/review.actions';
import { reviewFeature } from '../../store/review/review.reducer';
import { ChestsCardComponent } from './components/chests-card.component';
import { ContinuePathCardComponent } from './components/continue-path-card.component';
import { HeroBannerComponent } from './components/hero-banner.component';
import { MistakesCardComponent } from './components/mistakes-card.component';
import { OnlineFriendsComponent } from './components/online-friends.component';
import { QuickActionsComponent } from './components/quick-actions.component';
import { WeeklyTopComponent } from './components/weekly-top.component';
import {
  HOME_LEADERBOARD_COUNT,
  HOME_ONLINE_FRIENDS_COUNT,
  HOME_QUIZ_COUNT,
} from './home.constants';
import { newestOpenPath, sectionStatus } from './home.rules';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    InviteToPlayDialogComponent,
    PlayModalComponent,
    QuizCardComponent,
    SpinnerComponent,
    ChestsCardComponent,
    ContinuePathCardComponent,
    HeroBannerComponent,
    MistakesCardComponent,
    OnlineFriendsComponent,
    QuickActionsComponent,
    WeeklyTopComponent,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly store = inject(Store);

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly matchBusy = this.store.selectSignal(matchFeature.selectBusy);

  protected readonly myQuizzes = this.store.selectSignal(quizzesFeature.selectAllQuizzes);
  protected readonly featuredQuizzes = this.store.selectSignal(quizzesFeature.selectFeatured);
  protected readonly quizzesLoading = this.store.selectSignal(quizzesFeature.selectLoading);
  private readonly quizzesLoaded = this.store.selectSignal(quizzesFeature.selectLoaded);
  private readonly quizzesError = this.store.selectSignal(quizzesFeature.selectError);
  protected readonly quizzesStatus = computed(() =>
    sectionStatus(this.quizzesLoaded(), this.quizzesError()),
  );
  protected readonly showsFeatured = computed(
    () => this.quizzesLoaded() && this.myQuizzes().length === 0,
  );
  protected readonly shownQuizzes = computed(() => {
    const quizzes = this.showsFeatured() ? this.featuredQuizzes() : this.myQuizzes();
    return quizzes.slice(0, HOME_QUIZ_COUNT);
  });

  private readonly paths = this.store.selectSignal(pathsFeature.selectPaths);
  private readonly pathsLoaded = this.store.selectSignal(pathsFeature.selectLoaded);
  private readonly pathsError = this.store.selectSignal(pathsFeature.selectError);
  protected readonly pathsStatus = computed(() =>
    sectionStatus(this.pathsLoaded(), this.pathsError()),
  );
  protected readonly hasPaths = computed(() => this.paths().length > 0);
  protected readonly pathToContinue = computed(() => newestOpenPath(this.paths()));

  protected readonly dueToday = this.store.selectSignal(reviewFeature.selectDueToday);
  protected readonly reviewTotal = this.store.selectSignal(reviewFeature.selectTotal);
  private readonly reviewLoaded = this.store.selectSignal(reviewFeature.selectLoaded);
  private readonly reviewError = this.store.selectSignal(reviewFeature.selectError);
  protected readonly reviewStatus = computed(() =>
    sectionStatus(this.reviewLoaded(), this.reviewError()),
  );

  protected readonly chestsToOpen = this.store.selectSignal(chestsFeature.selectUnopenedCount);
  private readonly chestsLoaded = this.store.selectSignal(chestsFeature.selectLoaded);
  private readonly chestsError = this.store.selectSignal(chestsFeature.selectError);
  protected readonly chestsStatus = computed(() =>
    sectionStatus(this.chestsLoaded(), this.chestsError()),
  );

  private readonly friends = this.store.selectSignal(friendsFeature.selectAllFriends);
  protected readonly onlineFriends = this.store.selectSignal(friendsFeature.selectOnlineFriends);
  protected readonly friendsLoading = this.store.selectSignal(friendsFeature.selectLoading);
  private readonly friendsLoaded = this.store.selectSignal(friendsFeature.selectLoaded);
  private readonly friendsError = this.store.selectSignal(friendsFeature.selectError);
  protected readonly friendsStatus = computed(() =>
    sectionStatus(this.friendsLoaded(), this.friendsError()),
  );
  protected readonly hasFriends = computed(() => this.friends().length > 0);
  protected readonly onlineCount = computed(() => this.onlineFriends().length);
  protected readonly shownOnlineFriends = computed(() =>
    this.onlineFriends().slice(0, HOME_ONLINE_FRIENDS_COUNT),
  );

  private readonly leaderboard = this.store.selectSignal(leaderboardFeature.selectEntries);
  private readonly leaderboardLoaded = this.store.selectSignal(leaderboardFeature.selectLoaded);
  private readonly leaderboardError = this.store.selectSignal(leaderboardFeature.selectError);
  protected readonly weeklyStatus = computed(() =>
    sectionStatus(this.leaderboardLoaded(), this.leaderboardError()),
  );
  protected readonly weeklyTop = computed(() =>
    this.leaderboard().slice(0, HOME_LEADERBOARD_COUNT),
  );

  protected readonly anySectionFailed = computed(() =>
    [
      this.quizzesStatus(),
      this.pathsStatus(),
      this.reviewStatus(),
      this.chestsStatus(),
      this.friendsStatus(),
      this.weeklyStatus(),
    ].includes('failed'),
  );

  protected readonly invitedFriend = signal<PublicUser | null>(null);
  protected readonly playing = signal<QuizSummary | null>(null);

  constructor() {
    this.loadEverything();
  }

  protected loadEverything(): void {
    this.store.dispatch(QuizzesActions.load());
    this.store.dispatch(QuizzesActions.loadFeatured());
    this.store.dispatch(PathsActions.load());
    this.store.dispatch(ReviewActions.load());
    this.store.dispatch(ChestsActions.load());
    this.store.dispatch(FriendsActions.load());
    this.store.dispatch(LeaderboardActions.load({ scope: 'friends' }));
  }

  protected play(quiz: QuizSummary, choice: PlayChoice): void {
    this.store.dispatch(MatchActions.create({ request: { quizId: quiz.id, ...choice } }));
  }

  protected joinWithCode(inviteCode: string): void {
    this.store.dispatch(MatchActions.join({ inviteCode }));
  }

  protected openInvite(friend: PublicUser): void {
    this.invitedFriend.set(friend);
  }

  protected closeInvite(): void {
    this.invitedFriend.set(null);
  }

  protected sendInvite(request: CreateMatchRequest): void {
    this.store.dispatch(MatchActions.create({ request }));
  }
}
