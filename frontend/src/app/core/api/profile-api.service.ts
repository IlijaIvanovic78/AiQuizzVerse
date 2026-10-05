import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfileView, UpdateProfileRequest } from '../models/profile.model';
import { CurrentUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/profile`;

  me(): Observable<ProfileView> {
    return this.http.get<ProfileView>(`${this.baseUrl}/me`);
  }

  byUsername(username: string): Observable<ProfileView> {
    return this.http.get<ProfileView>(`${this.baseUrl}/${encodeURIComponent(username)}`);
  }

  updateMe(request: UpdateProfileRequest): Observable<CurrentUser> {
    return this.http.patch<CurrentUser>(`${this.baseUrl}/me`, request);
  }
}
