import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  AuthLoginResult,
  Login2FARequest,
  Enable2FAResponse,
  UsernameAvailability,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // ==================== REGISTER ====================
  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data);
  }

  // ==================== LOGIN ====================
  login(data: LoginRequest): Observable<AuthLoginResult> {
    return this.http.post<AuthLoginResult>(`${this.apiUrl}/login`, data);
  }

  // ==================== LOGIN WITH 2FA ====================
  login2FA(data: Login2FARequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/2fa`, data);
  }

  // ==================== REFRESH TOKEN ====================
  refreshToken(refreshToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
  }

  // ==================== LOGOUT ====================
  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {});
  }

  // ==================== GET PROFILE ====================
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  // ==================== 2FA ENABLE ====================
  enable2FA(): Observable<Enable2FAResponse> {
    return this.http.post<Enable2FAResponse>(`${this.apiUrl}/2fa/enable`, {});
  }

  // ==================== 2FA VERIFY ====================
  verify2FA(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/2fa/verify`, { token });
  }

  // ==================== 2FA DISABLE ====================
  disable2FA(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/2fa/disable`, {});
  }

  // ==================== CHECK USERNAME AVAILABILITY ====================
  checkUsernameAvailability(username: string): Observable<UsernameAvailability> {
    return this.http.get<UsernameAvailability>(`${this.apiUrl}/check-username/${username}`);
  }

  // ==================== CHECK EMAIL AVAILABILITY ====================
  checkEmailAvailability(email: string): Observable<UsernameAvailability> {
    return this.http.get<UsernameAvailability>(`${this.apiUrl}/check-email/${email}`);
  }
}
