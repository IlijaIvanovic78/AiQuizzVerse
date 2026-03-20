import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LeaderboardApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/leaderboard`;

  getGlobalLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/global`);
  }

  getFriendsLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/friends`);
  }
}
