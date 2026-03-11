import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, debounceTime, filter, tap } from 'rxjs/operators';
import { FriendsActions } from './friends.actions';
import { FriendsApiService, SocketService, ToastService } from '../../services';
import { Friend } from '../../models';

@Injectable()
export class FriendsEffects {
  private actions$ = inject(Actions);
  private friendsApi = inject(FriendsApiService);
  private socketService = inject(SocketService);
  private toastService = inject(ToastService);

  // Load Friends
  loadFriends$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.loadFriends),
      switchMap(() =>
        this.friendsApi.getFriends().pipe(
          map((friends) => FriendsActions.loadFriendsSuccess({ friends })),
          catchError((error) =>
            of(FriendsActions.loadFriendsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Load Pending Requests
  loadPendingRequests$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.loadPendingRequests),
      switchMap(() =>
        this.friendsApi.getPendingRequests().pipe(
          map((requests) => FriendsActions.loadPendingRequestsSuccess({ requests })),
          catchError((error) =>
            of(FriendsActions.loadPendingRequestsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Load Sent Requests
  loadSentRequests$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.loadSentRequests),
      switchMap(() =>
        this.friendsApi.getSentRequests().pipe(
          map((requests) => FriendsActions.loadSentRequestsSuccess({ requests })),
          catchError((error) =>
            of(FriendsActions.loadSentRequestsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Search Users (with debounce)
  searchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.searchUsers),
      debounceTime(300), // Wait 300ms after last keystroke
      filter(({ query }) => query.trim().length >= 2), // Minimum 2 characters
      switchMap(({ query }) =>
        this.friendsApi.searchUsers(query).pipe(
          map((results) => FriendsActions.searchUsersSuccess({ results })),
          catchError((error) =>
            of(FriendsActions.searchUsersFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Send Friend Request
  sendFriendRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.sendFriendRequest),
      switchMap(({ userId }) =>
        this.friendsApi.sendFriendRequest(userId).pipe(
          map((friendship) => FriendsActions.sendFriendRequestSuccess({ friendship })),
          catchError((error) =>
            of(FriendsActions.sendFriendRequestFailure({ error: error.message, userId }))
          )
        )
      )
    )
  );

  // Accept Friend Request
  acceptFriendRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.acceptFriendRequest),
      switchMap(({ friendshipId }) =>
        this.friendsApi.acceptFriendRequest(friendshipId).pipe(
          map((friendship) => FriendsActions.acceptFriendRequestSuccess({ friendship })),
          catchError((error) =>
            of(
              FriendsActions.acceptFriendRequestFailure({
                error: error.message,
                friendshipId,
              })
            )
          )
        )
      )
    )
  );

  // After accepting, reload friends list
  reloadFriendsAfterAccept$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.acceptFriendRequestSuccess),
      map(() => FriendsActions.loadFriends())
    )
  );

  // Reject Friend Request
  rejectFriendRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.rejectFriendRequest),
      switchMap(({ friendshipId }) =>
        this.friendsApi.rejectFriendRequest(friendshipId).pipe(
          map(() => FriendsActions.rejectFriendRequestSuccess({ friendshipId })),
          catchError((error) =>
            of(
              FriendsActions.rejectFriendRequestFailure({
                error: error.message,
                friendshipId,
              })
            )
          )
        )
      )
    )
  );

  // Remove Friend
  removeFriend$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.removeFriend),
      switchMap(({ friendshipId }) =>
        this.friendsApi.removeFriend(friendshipId).pipe(
          map(() => FriendsActions.removeFriendSuccess({ friendshipId })),
          catchError((error) =>
            of(
              FriendsActions.removeFriendFailure({
                error: error.message,
                friendshipId,
              })
            )
          )
        )
      )
    )
  );

  // Socket Event Listeners - Friend Online
  friendOnline$ = createEffect(() =>
    this.socketService.friendOnline$.pipe(
      map(({ userId }) => FriendsActions.friendOnline({ userId }))
    )
  );

  // Socket Event Listeners - Friend Offline
  friendOffline$ = createEffect(() =>
    this.socketService.friendOffline$.pipe(
      map(({ userId }) => FriendsActions.friendOffline({ userId }))
    )
  );

  // Socket Event Listeners - Friend Request Received
  friendRequestReceived$ = createEffect(() =>
    this.socketService.friendRequestSent$.pipe(
      tap(({ from }) => {
        this.toastService.info(
          'New Friend Request',
          `${from.username} sent you a friend request!`,
          7000
        );
      }),
      map(({ friendshipId, from }) =>
        FriendsActions.friendRequestReceived({
          request: {
            id: friendshipId,
            from,
            createdAt: new Date().toISOString(),
          },
        })
      )
    )
  );

  // Socket Event Listeners - Friend Request Accepted
  friendRequestAcceptedNotification$ = createEffect(() =>
    this.socketService.friendRequestAccepted$.pipe(
      tap(({ friend }) => {
        this.toastService.success(
          'Friend Request Accepted',
          `${friend.username} accepted your friend request!`,
          7000
        );
      }),
      map(({ friendshipId, friend }) => {
        const friendData: Friend = {
          id: friendshipId,
          userId: friend.id,
          username: friend.username,
          email: friend.email,
          avatarUrl: friend.avatarUrl,
          status: 'online', // They just accepted, so they're online
          since: new Date().toISOString(),
        };
        return FriendsActions.friendRequestAcceptedNotification({
          friendshipId,
          friend: friendData,
        });
      })
    )
  );
}
