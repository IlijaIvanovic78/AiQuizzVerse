import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs';
import { authFeature } from '../../store/auth/auth.reducer';

// The starter hero picker is only for players who have not chosen a hero yet.
export const noHeroGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(Store)
    .select(authFeature.selectAuthState)
    .pipe(
      filter((auth) => auth.status !== 'unknown'),
      take(1),
      map((auth) => (auth.user?.avatarKey ? router.createUrlTree(['/home']) : true)),
    );
};
