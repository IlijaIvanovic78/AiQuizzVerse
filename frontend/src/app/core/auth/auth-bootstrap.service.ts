import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { AuthActions } from '../../store/auth/auth.actions';
import { AuthApiService } from '../api/auth-api.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthBootstrapService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(TokenStorageService);
  private readonly store = inject(Store);

  async restore(): Promise<void> {
    if (!this.tokens.hasTokens()) {
      this.store.dispatch(AuthActions.sessionMissing());
      return;
    }
    try {
      const user = await firstValueFrom(this.authApi.me());
      this.store.dispatch(AuthActions.sessionRestored({ user }));
    } catch {
      this.store.dispatch(AuthActions.sessionMissing());
    }
  }
}
