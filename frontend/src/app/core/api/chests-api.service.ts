import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChestList, ChestOdds, OpenedChest } from '../models/chest.model';

@Injectable({ providedIn: 'root' })
export class ChestsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/chests`;

  list(): Observable<ChestList> {
    return this.http.get<ChestList>(this.baseUrl);
  }

  odds(): Observable<ChestOdds> {
    return this.http.get<ChestOdds>(`${this.baseUrl}/odds`);
  }

  open(chestId: string): Observable<OpenedChest> {
    return this.http.post<OpenedChest>(`${this.baseUrl}/${chestId}/open`, {});
  }
}
