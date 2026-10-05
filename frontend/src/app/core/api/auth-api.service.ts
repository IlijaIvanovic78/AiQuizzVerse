import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  LoginResult,
  RegisterRequest,
  TwoFactorLoginRequest,
  TwoFactorSetup,
  UsernameAvailability,
} from '../models/auth.model';
import { CurrentUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${this.baseUrl}/login`, request);
  }

  loginWithTwoFactor(request: TwoFactorLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login/2fa`, request);
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {});
  }

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/me`);
  }

  isUsernameAvailable(username: string): Observable<UsernameAvailability> {
    return this.http.get<UsernameAvailability>(`${this.baseUrl}/username-available`, {
      params: { username },
    });
  }

  setupTwoFactor(): Observable<TwoFactorSetup> {
    return this.http.post<TwoFactorSetup>(`${this.baseUrl}/2fa/setup`, {});
  }

  enableTwoFactor(code: string): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.baseUrl}/2fa/enable`, { code });
  }

  disableTwoFactor(code: string): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.baseUrl}/2fa/disable`, { code });
  }
}
