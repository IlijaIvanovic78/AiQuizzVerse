import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePathRequest, PathDetail, PathSummary } from '../models/path.model';

@Injectable({ providedIn: 'root' })
export class PathsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/paths`;

  create(request: CreatePathRequest): Observable<PathDetail> {
    return this.http.post<PathDetail>(this.baseUrl, request);
  }

  list(): Observable<PathSummary[]> {
    return this.http.get<PathSummary[]>(this.baseUrl);
  }

  get(pathId: string): Observable<PathDetail> {
    return this.http.get<PathDetail>(`${this.baseUrl}/${pathId}`);
  }

  delete(pathId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${pathId}`);
  }
}
