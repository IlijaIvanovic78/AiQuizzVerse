import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoostOffer, BoostPurchase, BoostType, ItemPurchase, ShopItem } from '../models/shop.model';
import { CurrentUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ShopApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/shop`;

  items(): Observable<ShopItem[]> {
    return this.http.get<ShopItem[]>(`${this.baseUrl}/items`);
  }

  buyItem(itemId: string): Observable<ItemPurchase> {
    return this.http.post<ItemPurchase>(`${this.baseUrl}/items/${itemId}/buy`, {});
  }

  equipItem(itemId: string): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.baseUrl}/items/${itemId}/equip`, {});
  }

  unequipPet(): Observable<CurrentUser> {
    return this.http.delete<CurrentUser>(`${this.baseUrl}/pet`);
  }

  claimStarter(itemId: string): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.baseUrl}/starters/${itemId}/claim`, {});
  }

  boosts(): Observable<BoostOffer[]> {
    return this.http.get<BoostOffer[]>(`${this.baseUrl}/boosts`);
  }

  buyBoost(type: BoostType): Observable<BoostPurchase> {
    return this.http.post<BoostPurchase>(`${this.baseUrl}/boosts/${type}/buy`, {});
  }
}
