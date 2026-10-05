import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PracticeQuiz, PracticeRequest, ReviewDeck } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/review`;

  getDeck(): Observable<ReviewDeck> {
    return this.http.get<ReviewDeck>(this.baseUrl);
  }

  practice(request: PracticeRequest): Observable<PracticeQuiz> {
    return this.http.post<PracticeQuiz>(`${this.baseUrl}/practice`, request);
  }
}
