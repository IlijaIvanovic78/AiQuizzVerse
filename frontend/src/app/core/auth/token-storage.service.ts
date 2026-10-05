import { Injectable } from '@angular/core';
import { AuthTokens } from '../models/auth.model';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './auth.constants';

// Tokens are read from localStorage every time so a refresh done in another tab is seen here too.
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  hasTokens(): boolean {
    return this.accessToken() !== null && this.refreshToken() !== null;
  }

  save(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
