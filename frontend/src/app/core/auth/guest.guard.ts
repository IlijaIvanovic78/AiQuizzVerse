import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, take } from 'rxjs';
import { authFeature } from '../../store/auth/auth.reducer';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(Store)
    .select(authFeature.selectStatus)
    .pipe(
      filter((status) => status !== 'unknown'),
      take(1),
      map((status) => (status === 'anonymous' ? true : router.createUrlTree(['/home']))),
    );
};
