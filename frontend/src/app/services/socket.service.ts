import { Injectable } from '@angular/core';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { map, share, takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import {
  FriendOnlineEvent,
  FriendOfflineEvent,
  FriendRequestSentEvent,
  FriendRequestAcceptedEvent,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();

  // Observable streams for socket events
  public friendOnline$: Observable<FriendOnlineEvent> | null = null;
  public friendOffline$: Observable<FriendOfflineEvent> | null = null;
  public friendRequestSent$: Observable<FriendRequestSentEvent> | null = null;
  public friendRequestAccepted$: Observable<FriendRequestAcceptedEvent> | null = null;

  /**
   * Connect to WebSocket server with JWT authentication
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Create socket connection with JWT token in auth
    this.socket = io(environment.apiUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Setup event listeners
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔴 Socket connection error:', error.message);
    });

    // Create observable streams from socket events
    this.friendOnline$ = fromEvent<FriendOnlineEvent>(this.socket, 'friend-online').pipe(
      takeUntil(this.destroy$),
      share()
    );

    this.friendOffline$ = fromEvent<FriendOfflineEvent>(this.socket, 'friend-offline').pipe(
      takeUntil(this.destroy$),
      share()
    );

    this.friendRequestSent$ = fromEvent<FriendRequestSentEvent>(
      this.socket,
      'friend-request-sent'
    ).pipe(
      takeUntil(this.destroy$),
      share()
    );

    this.friendRequestAccepted$ = fromEvent<FriendRequestAcceptedEvent>(
      this.socket,
      'friend-request-accepted'
    ).pipe(
      takeUntil(this.destroy$),
      share()
    );
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.destroy$.next();
      this.destroy$.complete();
      this.destroy$ = new Subject<void>();
      
      // Clear observables
      this.friendOnline$ = null;
      this.friendOffline$ = null;
      this.friendRequestSent$ = null;
      this.friendRequestAccepted$ = null;
      
      console.log('🔌 Socket disconnected and cleaned up');
    }
  }

  /**
   * Check if socket is currently connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID if connected
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}
