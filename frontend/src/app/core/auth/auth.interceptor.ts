import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PUBLIC_AUTH_PATHS } from './auth.constants';
import { TokenRefreshService } from './token-refresh.service';
import { TokenStorageService } from './token-storage.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!needsAccessToken(request)) {
    return next(request);
  }
  const tokenRefresh = inject(TokenRefreshService);
  const accessToken = inject(TokenStorageService).accessToken();
  if (!accessToken) {
    return next(request);
  }

  return next(withAccessToken(request, accessToken)).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error)) {
        return throwError(() => error);
      }
      return tokenRefresh
        .refresh()
        .pipe(switchMap((newToken) => next(withAccessToken(request, newToken))));
    }),
  );
};

function needsAccessToken(request: HttpRequest<unknown>): boolean {
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((path) => request.url.endsWith(path));
  return isApiRequest && !isPublicAuthPath;
}

function withAccessToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized;
}
