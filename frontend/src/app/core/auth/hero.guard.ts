import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs';
import { authFeature } from '../../store/auth/auth.reducer';

// New players pick a starter hero on /welcome before they can enter the app.
export const heroGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(Store)
    .select(authFeature.selectAuthState)
    .pipe(
      filter((auth) => auth.status !== 'unknown'),
      take(1),
      map((auth) => (auth.user?.avatarKey ? true : router.createUrlTree(['/welcome']))),
    );
};
