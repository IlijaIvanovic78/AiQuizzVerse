import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, catchError, concatMap, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { FriendsApiService } from '../../core/api/friends-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { FriendsActions } from './friends.actions';
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from './friends.constants';

@Injectable()
export class FriendsEffects {
  private readonly actions$ = inject(Actions);
  private readonly friendsApi = inject(FriendsApiService);
  private readonly toast = inject(ToastService);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.load),
      switchMap(() =>
        this.friendsApi.list().pipe(
          map((friends) => FriendsActions.loaded({ friends })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadRequests$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.loadRequests),
      switchMap(() =>
        this.friendsApi.requests().pipe(
          map((requests) => FriendsActions.requestsLoaded({ requests })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  // Wait until typing pauses, and drop the answer for an older query when a newer one starts.
  readonly search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.search),
      debounceTime(SEARCH_DEBOUNCE_MS),
      switchMap(({ query }) => this.searchUsers(query.trim())),
    ),
  );

  readonly sendRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.sendRequest),
      concatMap(({ userId }) =>
        this.friendsApi.sendRequest({ userId }).pipe(
          map((outcome) => FriendsActions.requestSent({ outcome })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly acceptRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.acceptRequest),
      concatMap(({ requestId }) =>
        this.friendsApi.acceptRequest(requestId).pipe(
          map((friend) => FriendsActions.friendAdded({ friend })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly removeRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.removeRequest),
      concatMap(({ requestId }) =>
        this.friendsApi.removeRequest(requestId).pipe(
          map(() => FriendsActions.requestRemoved({ requestId })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly removeFriend$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendsActions.removeFriend),
      concatMap(({ friendshipId }) =>
        this.friendsApi.removeFriend(friendshipId).pipe(
          map(() => FriendsActions.friendRemoved({ friendshipId })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly announceRequestSent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FriendsActions.requestSent),
        tap(({ outcome }) => {
          if (outcome.friend) {
            this.toast.success(`You and ${outcome.friend.user.username} are now friends!`);
          } else {
            this.toast.success('Friend request sent.');
          }
        }),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FriendsActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private searchUsers(query: string): Observable<Action> {
    if (query.length < MIN_SEARCH_LENGTH) {
      return of(FriendsActions.searchResultsLoaded({ results: [] }));
    }
    return this.friendsApi.search(query).pipe(
      map((results) => FriendsActions.searchResultsLoaded({ results })),
      catchError((error: unknown) => of(this.failed(error))),
    );
  }

  private failed(error: unknown): Action {
    return FriendsActions.failed({ error: readErrorMessage(error) });
  }
}
