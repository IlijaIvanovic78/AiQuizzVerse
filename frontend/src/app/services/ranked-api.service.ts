import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RankedJourney, StageCompleteResult } from '../models';

@Injectable({ providedIn: 'root' })
export class RankedApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ranked`;

  createJourney(topic: string, totalStages = 8): Observable<RankedJourney> {
    return this.http.post<RankedJourney>(`${this.baseUrl}/journey`, { topic, totalStages });
  }

  getJourneys(): Observable<RankedJourney[]> {
    return this.http.get<RankedJourney[]>(`${this.baseUrl}/journeys`);
  }

  getJourney(id: string): Observable<RankedJourney> {
    return this.http.get<RankedJourney>(`${this.baseUrl}/journey/${id}`);
  }

  completeStage(journeyId: string, stageId: string, score: number): Observable<StageCompleteResult> {
    return this.http.post<StageCompleteResult>(
      `${this.baseUrl}/journey/${journeyId}/stage/${stageId}/complete`,
      { score },
    );
  }
}
