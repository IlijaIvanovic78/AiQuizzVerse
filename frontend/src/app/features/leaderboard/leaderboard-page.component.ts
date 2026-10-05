import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { LeaderboardScope } from '../../core/models/leaderboard.model';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { PodiumComponent, PodiumPlace } from '../../shared/components/podium.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar.component';
import { authFeature } from '../../store/auth/auth.reducer';
import { LeaderboardActions } from '../../store/leaderboard/leaderboard.actions';
import { leaderboardFeature } from '../../store/leaderboard/leaderboard.reducer';
import { LeaderboardListComponent } from './components/leaderboard-list.component';

const PODIUM_SIZE = 3;

const SCOPE_CHOICES: { scope: LeaderboardScope; label: string }[] = [
  { scope: 'friends', label: 'Friends' },
  { scope: 'global', label: 'Global' },
];

@Component({
  selector: 'app-leaderboard-page',
  imports: [
    DecimalPipe,
    RouterLink,
    EmptyStateComponent,
    PageHeaderComponent,
    SpinnerComponent,
    UserAvatarComponent,
    LeaderboardListComponent,
    PodiumComponent,
  ],
  templateUrl: './leaderboard-page.component.html',
  styleUrl: './leaderboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardPageComponent {
  private readonly store = inject(Store);

  protected readonly scopes = SCOPE_CHOICES;
  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly scope = this.store.selectSignal(leaderboardFeature.selectScope);
  protected readonly entries = this.store.selectSignal(leaderboardFeature.selectEntries);
  protected readonly me = this.store.selectSignal(leaderboardFeature.selectMe);
  protected readonly loaded = this.store.selectSignal(leaderboardFeature.selectLoaded);
  protected readonly error = this.store.selectSignal(leaderboardFeature.selectError);

  protected readonly podium = computed(() =>
    this.entries()
      .slice(0, PODIUM_SIZE)
      .map((entry): PodiumPlace => ({ rank: entry.rank, user: entry.user, value: entry.weeklyXp })),
  );
  protected readonly others = computed(() => this.entries().slice(PODIUM_SIZE));

  constructor() {
    this.show('friends');
  }

  protected show(scope: LeaderboardScope): void {
    this.store.dispatch(LeaderboardActions.load({ scope }));
  }
}
