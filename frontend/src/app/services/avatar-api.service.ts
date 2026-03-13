import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ShopItem, UserItem } from '../models';

@Injectable({ providedIn: 'root' })
export class AvatarApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/avatar`;

  getMyItems(): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(`${this.baseUrl}/items`);
  }

  getEquipped(): Observable<UserItem | null> {
    return this.http.get<UserItem | null>(`${this.baseUrl}/equipped`);
  }

  selectAvatar(userItemId: string): Observable<UserItem> {
    return this.http.post<UserItem>(`${this.baseUrl}/select/${userItemId}`, {});
  }

  getStarters(): Observable<ShopItem[]> {
    return this.http.get<ShopItem[]>(`${this.baseUrl}/starters`);
  }

  selectStarter(itemId: string): Observable<UserItem> {
    return this.http.post<UserItem>(`${this.baseUrl}/select-starter`, { itemId });
  }

  getMyPets(): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(`${this.baseUrl}/pets`);
  }

  getEquippedPet(): Observable<UserItem | null> {
    return this.http.get<UserItem | null>(`${this.baseUrl}/pets/equipped`);
  }

  selectPet(userItemId: string): Observable<UserItem> {
    return this.http.post<UserItem>(`${this.baseUrl}/pets/select/${userItemId}`, {});
  }

  unequipPet(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/pets/unequip`);
  }
}
