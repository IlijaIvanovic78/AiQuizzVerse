import { HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';
import { AuthActions } from '../../store/auth/auth.actions';
import { readErrorStatus } from '../api/api-error';
import { AuthApiService } from '../api/auth-api.service';
import { AuthResponse } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(TokenStorageService);
  private readonly store = inject(Store);
  private refresh$: Observable<string> | null = null;

  // Every caller that hits a 401 at the same time shares one refresh request,
  // because the server rotates the refresh token and a second call would fail.
  // finalize sits before shareReplay, so the slot is freed once, when the request itself ends.
  refresh(): Observable<string> {
    this.refresh$ ??= this.requestNewAccessToken().pipe(
      finalize(() => {
        this.refresh$ = null;
      }),
      shareReplay(1),
    );
    return this.refresh$;
  }

  private requestNewAccessToken(): Observable<string> {
    const usedRefreshToken = this.tokens.refreshToken();
    if (!usedRefreshToken) {
      return this.endSession(new Error('No refresh token'));
    }
    return this.authApi.refresh(usedRefreshToken).pipe(
      map((response) => this.storeNewTokens(response)),
      catchError((error: unknown) => this.recoverFromFailedRefresh(usedRefreshToken, error)),
    );
  }

  private storeNewTokens(response: AuthResponse): string {
    this.tokens.save(response);
    this.store.dispatch(AuthActions.tokensRefreshed({ user: response.user }));
    return response.accessToken;
  }

  // Another tab may have refreshed first; its new tokens are already in storage.
  // Only a refresh token the server refused ends the session. A dropped connection or a server
  // error keeps the tokens, so the next request can try again.
  private recoverFromFailedRefresh(usedRefreshToken: string, error: unknown): Observable<string> {
    const storedRefreshToken = this.tokens.refreshToken();
    const storedAccessToken = this.tokens.accessToken();
    if (storedAccessToken && storedRefreshToken && storedRefreshToken !== usedRefreshToken) {
      return of(storedAccessToken);
    }
    if (readErrorStatus(error) !== HttpStatusCode.Unauthorized) {
      return throwError(() => error);
    }
    return this.endSession(error);
  }

  private endSession(error: unknown): Observable<never> {
    this.tokens.clear();
    this.store.dispatch(AuthActions.sessionExpired());
    return throwError(() => error);
  }
}
