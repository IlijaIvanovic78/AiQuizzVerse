import { HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { AuthActions } from '../../store/auth/auth.actions';
import { readErrorMessage, readErrorStatus } from '../api/api-error';
import { AuthApiService } from '../api/auth-api.service';
import { ToastService } from '../notifications/toast.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthBootstrapService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(TokenStorageService);
  private readonly store = inject(Store);
  private readonly toast = inject(ToastService);

  async restore(): Promise<void> {
    if (!this.tokens.hasTokens()) {
      this.store.dispatch(AuthActions.sessionMissing());
      return;
    }
    try {
      const user = await firstValueFrom(this.authApi.me());
      this.store.dispatch(AuthActions.sessionRestored({ user }));
    } catch (error: unknown) {
      this.explainFailedRestore(error);
      this.store.dispatch(AuthActions.sessionMissing());
    }
  }

  // An ended session already got its own message from the token refresh. Any other failure,
  // like a server that is still starting, is shown so the player knows why they must log in.
  private explainFailedRestore(error: unknown): void {
    if (readErrorStatus(error) !== HttpStatusCode.Unauthorized) {
      this.toast.error(readErrorMessage(error));
    }
  }
}
