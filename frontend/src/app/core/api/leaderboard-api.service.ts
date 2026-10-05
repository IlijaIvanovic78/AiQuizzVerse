import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Leaderboard, LeaderboardScope } from '../models/leaderboard.model';

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/leaderboard`;

  get(scope: LeaderboardScope): Observable<Leaderboard> {
    return this.http.get<Leaderboard>(this.baseUrl, { params: { scope } });
  }
}
