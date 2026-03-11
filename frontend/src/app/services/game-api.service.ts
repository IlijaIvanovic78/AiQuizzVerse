import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Match, MatchType, MatchPlayer } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GameApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createMatch(quizId: string, type: MatchType): Observable<Match> {
    return this.http.post<Match>(`${this.apiUrl}/game/match`, { quizId, type });
  }

  joinMatch(inviteCode: string): Observable<Match> {
    return this.http.post<Match>(`${this.apiUrl}/game/join`, { inviteCode });
  }

  getMatch(matchId: string): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/game/match/${matchId}`);
  }

  getHistory(): Observable<(MatchPlayer & { match: Match })[]> {
    return this.http.get<(MatchPlayer & { match: Match })[]>(`${this.apiUrl}/game/history`);
  }
}
