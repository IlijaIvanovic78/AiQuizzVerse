import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateMatchRequest,
  InviteToMatchRequest,
  JoinMatchRequest,
  MatchHistoryEntry,
  MatchResult,
  MatchView,
} from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/matches`;

  create(request: CreateMatchRequest): Observable<MatchView> {
    return this.http.post<MatchView>(this.baseUrl, request);
  }

  join(request: JoinMatchRequest): Observable<MatchView> {
    return this.http.post<MatchView>(`${this.baseUrl}/join`, request);
  }

  history(): Observable<MatchHistoryEntry[]> {
    return this.http.get<MatchHistoryEntry[]>(`${this.baseUrl}/history`);
  }

  get(matchId: string): Observable<MatchView> {
    return this.http.get<MatchView>(`${this.baseUrl}/${matchId}`);
  }

  result(matchId: string): Observable<MatchResult> {
    return this.http.get<MatchResult>(`${this.baseUrl}/${matchId}/result`);
  }

  invite(matchId: string, request: InviteToMatchRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${matchId}/invite`, request);
  }

  rematch(matchId: string): Observable<MatchView> {
    return this.http.post<MatchView>(`${this.baseUrl}/${matchId}/rematch`, {});
  }
}
