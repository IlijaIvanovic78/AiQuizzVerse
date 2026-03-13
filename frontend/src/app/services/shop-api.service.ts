import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ShopItem, UserItem, UserBoost, BoostType } from '../models';

@Injectable({ providedIn: 'root' })
export class ShopApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/shop`;

  getItems(type?: string): Observable<ShopItem[]> {
    const params: Record<string, string> = {};
    if (type) params['type'] = type;
    return this.http.get<ShopItem[]>(`${this.baseUrl}/items`, { params });
  }

  buyItem(itemId: string): Observable<UserItem> {
    return this.http.post<UserItem>(`${this.baseUrl}/buy-item`, { itemId });
  }

  buyBoost(type: BoostType): Observable<UserBoost> {
    return this.http.post<UserBoost>(`${this.baseUrl}/buy-boost`, { type });
  }

  getMyBoosts(): Observable<UserBoost[]> {
    return this.http.get<UserBoost[]>(`${this.baseUrl}/my-boosts`);
  }
}
