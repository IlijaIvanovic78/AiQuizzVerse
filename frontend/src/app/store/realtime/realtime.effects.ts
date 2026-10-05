import { Injectable, inject } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { map, merge, tap } from 'rxjs';
import { ToastService } from '../../core/notifications/toast.service';
import { RealtimeSocketService } from '../../core/realtime/realtime-socket.service';
import { CHEST_NAMES } from '../../shared/chests';
import { AuthActions } from '../auth/auth.actions';
import { ChestsActions } from '../chests/chests.actions';
import { FriendsActions } from '../friends/friends.actions';
import { MatchActions } from '../match/match.actions';
import { QuizzesActions } from '../quizzes/quizzes.actions';

@Injectable()
export class RealtimeEffects {
  private readonly socket = inject(RealtimeSocketService);
  private readonly toast = inject(ToastService);

  readonly realtimeEvents$ = createEffect(() => {
    const friendRequest$ = this.socket.friendRequest$.pipe(
      map((request) => FriendsActions.requestReceived({ request })),
    );
    const friendAccepted$ = this.socket.friendAccepted$.pipe(
      map((friend) => FriendsActions.friendAdded({ friend })),
    );
    const requestRemoved$ = this.socket.requestRemoved$.pipe(
      map(({ requestId }) => FriendsActions.requestRemoved({ requestId })),
    );
    const friendRemoved$ = this.socket.friendRemoved$.pipe(
      map(({ friendshipId }) => FriendsActions.friendRemoved({ friendshipId })),
    );
    const friendOnline$ = this.socket.friendOnline$.pipe(
      map(({ userId }) => FriendsActions.presenceChanged({ userId, isOnline: true })),
    );
    const friendOffline$ = this.socket.friendOffline$.pipe(
      map(({ userId }) => FriendsActions.presenceChanged({ userId, isOnline: false })),
    );
    const duelInvite$ = this.socket.duelInvite$.pipe(
      map((invite) => MatchActions.inviteReceived({ invite })),
    );
    const coinsUpdated$ = this.socket.coinsUpdated$.pipe(
      map(({ coins }) => AuthActions.coinsUpdated({ coins })),
    );
    const quizProgress$ = this.socket.quizProgress$.pipe(
      map((progress) => QuizzesActions.progressReceived({ progress })),
    );
    const chestEarned$ = this.socket.chestEarned$.pipe(
      map(({ chest }) => ChestsActions.earned({ chest })),
    );

    return merge(
      friendRequest$,
      friendAccepted$,
      requestRemoved$,
      friendRemoved$,
      friendOnline$,
      friendOffline$,
      duelInvite$,
      coinsUpdated$,
      quizProgress$,
      chestEarned$,
    );
  });

  readonly friendToasts$ = createEffect(
    () => {
      const requestToast$ = this.socket.friendRequest$.pipe(
        tap((request) =>
          this.toast.info(`${request.user.username} wants to be your friend.`, {
            label: 'Accept',
            action: FriendsActions.acceptRequest({ requestId: request.id }),
          }),
        ),
      );
      const acceptedToast$ = this.socket.friendAccepted$.pipe(
        tap((friend) => this.toast.success(`${friend.user.username} is now your friend!`)),
      );
      return merge(requestToast$, acceptedToast$);
    },
    { dispatch: false },
  );

  readonly chestToast$ = createEffect(
    () =>
      this.socket.chestEarned$.pipe(
        tap(({ chest }) =>
          this.toast.success(`You earned a ${CHEST_NAMES[chest.type].toLowerCase()}!`, {
            label: 'Open',
            action: ChestsActions.visitTreasureRoom(),
          }),
        ),
      ),
    { dispatch: false },
  );
}
