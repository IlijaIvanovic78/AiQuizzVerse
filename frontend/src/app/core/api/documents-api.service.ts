import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentSummary } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/documents`;

  upload(file: File): Observable<DocumentSummary> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentSummary>(this.baseUrl, formData);
  }
}
