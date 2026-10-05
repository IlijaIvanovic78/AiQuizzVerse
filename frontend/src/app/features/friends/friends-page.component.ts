import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Friend } from '../../core/models/friend.model';
import { PublicUser } from '../../core/models/user.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import {
  InviteToPlayDialogComponent,
  PlayInvite,
} from '../../shared/components/invite-to-play-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { FriendsActions } from '../../store/friends/friends.actions';
import { friendsFeature } from '../../store/friends/friends.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { QuizzesActions } from '../../store/quizzes/quizzes.actions';
import { quizzesFeature } from '../../store/quizzes/quizzes.reducer';
import { FriendListComponent } from './components/friend-list.component';
import { FriendRequestsComponent } from './components/friend-requests.component';
import { FriendSearchComponent } from './components/friend-search.component';

@Component({
  selector: 'app-friends-page',
  imports: [
    ConfirmDialogComponent,
    EmptyStateComponent,
    InviteToPlayDialogComponent,
    PageHeaderComponent,
    SpinnerComponent,
    FriendListComponent,
    FriendRequestsComponent,
    FriendSearchComponent,
  ],
  templateUrl: './friends-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendsPageComponent {
  private readonly store = inject(Store);

  private readonly allFriends = this.store.selectSignal(friendsFeature.selectAllFriends);
  protected readonly friends = computed(() => onlineFirst(this.allFriends()));
  protected readonly loaded = this.store.selectSignal(friendsFeature.selectLoaded);
  protected readonly error = this.store.selectSignal(friendsFeature.selectError);
  protected readonly busy = this.store.selectSignal(friendsFeature.selectBusy);
  protected readonly incoming = this.store.selectSignal(friendsFeature.selectIncoming);
  protected readonly outgoing = this.store.selectSignal(friendsFeature.selectOutgoing);
  protected readonly searchResults = this.store.selectSignal(friendsFeature.selectSearchResults);
  protected readonly searching = this.store.selectSignal(friendsFeature.selectSearching);
  protected readonly query = signal('');

  protected readonly myQuizzes = this.store.selectSignal(quizzesFeature.selectAllQuizzes);
  protected readonly featuredQuizzes = this.store.selectSignal(quizzesFeature.selectFeatured);
  protected readonly quizzesLoaded = this.store.selectSignal(quizzesFeature.selectLoaded);
  protected readonly matchBusy = this.store.selectSignal(matchFeature.selectBusy);

  protected readonly friendToRemove = signal<Friend | null>(null);
  protected readonly removeMessage = computed(
    () =>
      `${this.friendToRemove()?.user.username} will leave your friends list. ` +
      'You can send a new request later.',
  );
  protected readonly invitedFriend = signal<PublicUser | null>(null);

  constructor() {
    this.loadFriends();
  }

  protected loadFriends(): void {
    this.store.dispatch(FriendsActions.load());
    this.store.dispatch(FriendsActions.loadRequests());
  }

  // Every keystroke is dispatched; the effect waits for a pause and cancels older searches.
  protected search(query: string): void {
    this.query.set(query);
    this.store.dispatch(FriendsActions.search({ query }));
  }

  protected sendRequest(userId: string): void {
    this.store.dispatch(FriendsActions.sendRequest({ userId }));
  }

  protected acceptRequest(requestId: string): void {
    this.store.dispatch(FriendsActions.acceptRequest({ requestId }));
  }

  protected removeRequest(requestId: string): void {
    this.store.dispatch(FriendsActions.removeRequest({ requestId }));
  }

  protected askToRemove(friend: Friend): void {
    this.friendToRemove.set(friend);
  }

  protected confirmRemove(friend: Friend): void {
    this.store.dispatch(FriendsActions.removeFriend({ friendshipId: friend.friendshipId }));
    this.friendToRemove.set(null);
  }

  protected openInvite(friend: PublicUser): void {
    this.invitedFriend.set(friend);
    if (!this.quizzesLoaded()) {
      this.store.dispatch(QuizzesActions.load());
      this.store.dispatch(QuizzesActions.loadFeatured());
    }
  }

  protected sendInvite(friend: PublicUser, invite: PlayInvite): void {
    this.store.dispatch(
      MatchActions.create({
        request: { quizId: invite.quizId, mode: invite.mode, inviteFriendId: friend.id },
      }),
    );
  }
}

function onlineFirst(friends: Friend[]): Friend[] {
  return [...friends].sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
}
