import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, filter, map, take } from 'rxjs';
import { authFeature } from '../../store/auth/auth.reducer';

// New players pick a starter hero on /welcome before they can enter the app.
export const heroGuard: CanActivateFn = () => {
  const router = inject(Router);
  return playerHasHero(inject(Store)).pipe(
    map((hasHero) => (hasHero ? true : router.createUrlTree(['/welcome']))),
  );
};

// The starter hero picker is only for players who have not chosen a hero yet.
export const noHeroGuard: CanActivateFn = () => {
  const router = inject(Router);
  return playerHasHero(inject(Store)).pipe(
    map((hasHero) => (hasHero ? router.createUrlTree(['/home']) : true)),
  );
};

function playerHasHero(store: Store): Observable<boolean> {
  return store.select(authFeature.selectAuthState).pipe(
    filter((auth) => auth.status !== 'unknown'),
    take(1),
    map((auth) => Boolean(auth.user?.avatarKey)),
  );
}
