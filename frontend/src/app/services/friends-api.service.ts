import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Friend,
  FriendRequest,
  SentFriendRequest,
  UserSearchResult,
  FriendshipResponse,
} from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FriendsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/friends`;

  /**
   * Search users by username or email
   */
  searchUsers(query: string): Observable<UserSearchResult[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<UserSearchResult[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Send friend request to a user
   */
  sendFriendRequest(userId: string): Observable<FriendshipResponse> {
    return this.http.post<FriendshipResponse>(`${this.apiUrl}/request/${userId}`, {});
  }

  /**
   * Accept incoming friend request
   */
  acceptFriendRequest(friendshipId: string): Observable<FriendshipResponse> {
    return this.http.post<FriendshipResponse>(`${this.apiUrl}/accept/${friendshipId}`, {});
  }

  /**
   * Reject incoming friend request
   */
  rejectFriendRequest(friendshipId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reject/${friendshipId}`, {});
  }

  /**
   * Remove friend (delete friendship)
   */
  removeFriend(friendshipId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${friendshipId}`);
  }

  /**
   * Get list of all friends (accepted friendships)
   */
  getFriends(): Observable<Friend[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((response) =>
        response.map((item) => ({
          id: item.friendshipId ?? item.id,
          userId: item.friend?.id ?? item.userId,
          username: item.friend?.username ?? item.username,
          email: item.friend?.email ?? item.email,
          avatarUrl: item.friend?.avatarUrl ?? item.avatarUrl ?? null,
          status: item.isOnline ? 'online' as const : 'offline' as const,
          since: item.since ?? item.createdAt,
        })),
      ),
    );
  }

  /**
   * Get list of pending incoming friend requests
   */
  getPendingRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/pending`);
  }

  /**
   * Get list of sent friend requests
   */
  getSentRequests(): Observable<SentFriendRequest[]> {
    return this.http.get<SentFriendRequest[]>(`${this.apiUrl}/sent`);
  }
}
