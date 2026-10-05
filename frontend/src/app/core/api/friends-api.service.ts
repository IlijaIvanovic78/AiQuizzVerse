import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Friend,
  FriendRequestOutcome,
  FriendRequests,
  SendFriendRequest,
  UserSearchResult,
} from '../models/friend.model';

@Injectable({ providedIn: 'root' })
export class FriendsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/friends`;

  list(): Observable<Friend[]> {
    return this.http.get<Friend[]>(this.baseUrl);
  }

  requests(): Observable<FriendRequests> {
    return this.http.get<FriendRequests>(`${this.baseUrl}/requests`);
  }

  search(query: string): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(`${this.baseUrl}/search`, { params: { q: query } });
  }

  sendRequest(request: SendFriendRequest): Observable<FriendRequestOutcome> {
    return this.http.post<FriendRequestOutcome>(`${this.baseUrl}/requests`, request);
  }

  acceptRequest(requestId: string): Observable<Friend> {
    return this.http.post<Friend>(`${this.baseUrl}/requests/${requestId}/accept`, {});
  }

  removeRequest(requestId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/requests/${requestId}`);
  }

  removeFriend(friendshipId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${friendshipId}`);
  }
}
