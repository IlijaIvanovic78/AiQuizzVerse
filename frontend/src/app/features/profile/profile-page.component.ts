import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { AuthApiService } from '../../core/api/auth-api.service';
import { ProfileApiService } from '../../core/api/profile-api.service';
import { TwoFactorSetup } from '../../core/models/auth.model';
import { ProfileView } from '../../core/models/profile.model';
import { ToastService } from '../../core/notifications/toast.service';
import { SoundService } from '../../core/sound/sound.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PixelIconName } from '../../shared/components/pixel-icon.component';
import { RelationActionsComponent } from '../../shared/components/relation-actions.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { StatTileComponent } from '../../shared/components/stat-tile.component';
import { AuthActions } from '../../store/auth/auth.actions';
import { authFeature } from '../../store/auth/auth.reducer';
import { FriendsActions } from '../../store/friends/friends.actions';
import { friendsFeature } from '../../store/friends/friends.reducer';
import { MatchHistoryActions } from '../../store/match-history/match-history.actions';
import { matchHistoryFeature } from '../../store/match-history/match-history.reducer';
import { PaymentsActions } from '../../store/shop/payments.actions';
import { shopFeature } from '../../store/shop/shop.reducer';
import { MasteryListComponent } from './components/mastery-list.component';
import { MatchHistoryListComponent } from './components/match-history-list.component';
import { ProfileHeroCardComponent } from './components/profile-hero-card.component';
import { ProfileSettingsComponent } from './components/profile-settings.component';
import { PurchaseListComponent } from './components/purchase-list.component';

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: ProfileView }
  | { status: 'missing' }
  | { status: 'failed'; message: string };

interface StatTile {
  label: string;
  value: string | number;
  icon: PixelIconName;
}

const LOADING: ProfileState = { status: 'loading' };

@Component({
  selector: 'app-profile-page',
  imports: [
    RouterLink,
    EmptyStateComponent,
    RelationActionsComponent,
    SpinnerComponent,
    StatTileComponent,
    MasteryListComponent,
    MatchHistoryListComponent,
    ProfileHeroCardComponent,
    ProfileSettingsComponent,
    PurchaseListComponent,
  ],
  templateUrl: './profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly profileApi = inject(ProfileApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly sound = inject(SoundService);

  // Empty on /profile, the player's name on /profile/:username.
  readonly username = input<string>();

  protected readonly me = this.store.selectSignal(authFeature.selectUser);
  protected readonly settingsPending = this.store.selectSignal(authFeature.selectPending);
  protected readonly friendsBusy = this.store.selectSignal(friendsFeature.selectBusy);
  protected readonly history = this.store.selectSignal(matchHistoryFeature.selectEntries);
  protected readonly historyLoaded = this.store.selectSignal(matchHistoryFeature.selectLoaded);
  protected readonly purchases = this.store.selectSignal(shopFeature.selectPurchases);
  protected readonly purchasesLoading = this.store.selectSignal(shopFeature.selectLoading);

  private readonly retry$ = new Subject<void>();
  protected readonly state = toSignal(
    toObservable(this.username).pipe(
      switchMap((username) =>
        this.refreshes().pipe(
          startWith(null),
          switchMap(() => this.fetchProfile(username)),
          startWith(LOADING),
        ),
      ),
    ),
    { initialValue: LOADING },
  );
  protected readonly profile = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.profile : null;
  });
  protected readonly failedMessage = computed(() => {
    const state = this.state();
    return state.status === 'failed' ? state.message : null;
  });
  protected readonly isMe = computed(() => this.profile()?.relation === 'SELF');
  protected readonly friendRelation = computed(() => {
    const relation = this.profile()?.relation;
    return relation && relation !== 'SELF' ? relation : null;
  });
  protected readonly levelProgress = computed(() => {
    const me = this.me();
    if (!this.isMe() || !me) {
      return null;
    }
    return { current: me.xpIntoLevel, total: me.xpForNextLevel };
  });
  protected readonly statTiles = computed(() => {
    const profile = this.profile();
    return profile ? statTilesFor(profile) : [];
  });

  protected readonly twoFactorSetup = signal<TwoFactorSetup | null>(null);
  protected readonly loadingSetup = signal(false);

  constructor() {
    effect(() => {
      if (this.isMe()) {
        untracked(() => this.loadMyHistory());
      }
    });
    this.actions$
      .pipe(ofType(AuthActions.twoFactorChanged), takeUntilDestroyed())
      .subscribe(() => this.twoFactorSetup.set(null));
    // The old name in the address bar would not be found any more after a rename.
    this.actions$
      .pipe(ofType(AuthActions.usernameChanged), takeUntilDestroyed())
      .subscribe(() => this.afterRename());
  }

  protected retry(): void {
    this.retry$.next();
  }

  protected sendRequest(profile: ProfileView): void {
    this.store.dispatch(FriendsActions.sendRequest({ userId: profile.user.id }));
  }

  protected acceptRequest(profile: ProfileView): void {
    if (profile.friendshipId) {
      this.store.dispatch(FriendsActions.acceptRequest({ requestId: profile.friendshipId }));
    }
  }

  protected cancelRequest(profile: ProfileView): void {
    if (profile.friendshipId) {
      this.store.dispatch(FriendsActions.removeRequest({ requestId: profile.friendshipId }));
    }
  }

  protected rename(username: string): void {
    this.store.dispatch(AuthActions.changeUsername({ username }));
  }

  protected startTwoFactorSetup(): void {
    this.loadingSetup.set(true);
    this.authApi
      .setupTwoFactor()
      .pipe(
        finalize(() => this.loadingSetup.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (setup) => this.twoFactorSetup.set(setup),
        error: (error: unknown) => this.toast.error(readErrorMessage(error)),
      });
  }

  protected cancelTwoFactorSetup(): void {
    this.twoFactorSetup.set(null);
  }

  protected enableTwoFactor(code: string): void {
    this.store.dispatch(AuthActions.enableTwoFactor({ code }));
  }

  protected disableTwoFactor(code: string): void {
    this.store.dispatch(AuthActions.disableTwoFactor({ code }));
  }

  protected logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  // A friendship change on this page or from a socket event changes the relation buttons.
  private refreshes(): Observable<unknown> {
    const friendshipChanged$ = this.actions$.pipe(
      ofType(
        FriendsActions.requestSent,
        FriendsActions.requestReceived,
        FriendsActions.friendAdded,
        FriendsActions.requestRemoved,
        FriendsActions.friendRemoved,
      ),
    );
    return merge(friendshipChanged$, this.retry$);
  }

  private fetchProfile(username: string | undefined): Observable<ProfileState> {
    const request$ = username ? this.profileApi.byUsername(username) : this.profileApi.me();
    return request$.pipe(
      map((profile): ProfileState => ({ status: 'ready', profile })),
      catchError((error: unknown) => of(failedState(error))),
    );
  }

  private loadMyHistory(): void {
    this.store.dispatch(MatchHistoryActions.load());
    this.store.dispatch(PaymentsActions.loadHistory());
  }

  private afterRename(): void {
    if (this.username()) {
      void this.router.navigate(['/profile']);
    } else {
      this.retry$.next();
    }
  }
}

function failedState(error: unknown): ProfileState {
  if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.NotFound) {
    return { status: 'missing' };
  }
  return { status: 'failed', message: readErrorMessage(error) };
}

function statTilesFor({ stats, user, relation }: ProfileView): StatTile[] {
  const tiles: StatTile[] = [
    { label: 'Matches played', value: stats.matchesPlayed, icon: 'bolt' },
    { label: 'Wins', value: stats.wins, icon: 'trophy' },
    { label: 'Questions answered', value: stats.questionsAnswered, icon: 'check' },
    { label: 'Accuracy', value: `${stats.accuracy}%`, icon: 'star-empty' },
    { label: 'Quizzes created', value: stats.quizzesCreated, icon: 'heart' },
    { label: 'Path stars', value: stats.pathStars, icon: 'star' },
    { label: 'Best streak', value: user.longestStreak, icon: 'flame' },
  ];
  if (relation === 'SELF') {
    tiles.push({ label: 'Mistakes to review', value: stats.mistakesToReview, icon: 'cross' });
  }
  return tiles;
}
