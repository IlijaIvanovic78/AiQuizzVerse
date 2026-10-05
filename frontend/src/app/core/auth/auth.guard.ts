import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs';
import { authFeature } from '../../store/auth/auth.reducer';
import { RETURN_URL_PARAM } from './auth.constants';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(Store)
    .select(authFeature.selectStatus)
    .pipe(
      filter((status) => status !== 'unknown'),
      take(1),
      map((status) => (status === 'authenticated' ? true : loginPage(router, state.url))),
    );
};

function loginPage(router: Router, attemptedUrl: string): UrlTree {
  if (attemptedUrl === '/') {
    return router.createUrlTree(['/login']);
  }
  return router.createUrlTree(['/login'], { queryParams: { [RETURN_URL_PARAM]: attemptedUrl } });
}
