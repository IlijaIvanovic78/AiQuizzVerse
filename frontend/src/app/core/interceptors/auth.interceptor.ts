import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpClient,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { selectAccessToken, selectRefreshToken } from '../../store/auth/auth.selectors';
import { AuthActions } from '../../store/auth/auth.actions';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const store = inject(Store);
  const http = inject(HttpClient);

  // Skip auth header for public endpoints
  const skipUrls = ['/auth/login', '/auth/register', '/auth/login/2fa', '/auth/check-'];
  const shouldSkip = skipUrls.some((url) => req.url.includes(url));

  if (shouldSkip) {
    return next(req);
  }

  // Skip if request already has Authorization header (e.g. refresh token request)
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  // Get access token from store and attach to request
  let accessToken: string | null = null;
  store
    .select(selectAccessToken)
    .pipe(take(1))
    .subscribe((token) => (accessToken = token));

  const clonedReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && accessToken) {
        return handle401Error(req, next, store, http);
      }
      return throwError(() => error);
    }),
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  store: Store,
  http: HttpClient,
) {
  // If already refreshing, queue this request until new token arrives
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => {
        const clonedReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(clonedReq);
      }),
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  // Get refresh token from store
  let refreshToken: string | null = null;
  store
    .select(selectRefreshToken)
    .pipe(take(1))
    .subscribe((token) => (refreshToken = token));

  if (!refreshToken) {
    isRefreshing = false;
    store.dispatch(AuthActions.logout());
    return throwError(() => new Error('No refresh token available'));
  }

  // Call refresh endpoint directly (bypass interceptor via custom header)
  return http
    .post<LoginResponse>(
      `${environment.apiUrl}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    )
    .pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);

        // Update tokens in store
        store.dispatch(
          AuthActions.refreshTokenSuccess({ response }),
        );

        // Retry the original request with the new token
        const clonedReq = req.clone({
          setHeaders: { Authorization: `Bearer ${response.accessToken}` },
        });
        return next(clonedReq);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        store.dispatch(AuthActions.logout());
        return throwError(() => refreshError);
      }),
    );
}
