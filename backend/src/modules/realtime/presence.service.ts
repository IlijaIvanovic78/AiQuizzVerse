import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { OFFLINE_GRACE_MS } from './realtime.constants';

@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly socketsByUser = new Map<string, Set<string>>();
  private readonly offlineTimers = new Map<string, NodeJS.Timeout>();

  /** Returns true for the first socket of a user, when friends should hear they came online. */
  connect(userId: string, socketId: string): boolean {
    const wasOnline = this.isOnline(userId);
    this.cancelOfflineTimer(userId);

    const sockets = this.socketsByUser.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.socketsByUser.set(userId, sockets);
    return !wasOnline;
  }

  /** The user stays online for a short grace period so a page refresh does not flicker. */
  disconnect(userId: string, socketId: string, onOffline: () => void): void {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets) {
      return;
    }
    sockets.delete(socketId);
    if (sockets.size > 0) {
      return;
    }

    this.cancelOfflineTimer(userId);
    const timer = setTimeout(() => this.goOffline(userId, onOffline), OFFLINE_GRACE_MS);
    this.offlineTimers.set(userId, timer);
  }

  isOnline(userId: string): boolean {
    return this.socketsByUser.has(userId);
  }

  onModuleDestroy(): void {
    this.offlineTimers.forEach((timer) => clearTimeout(timer));
  }

  private goOffline(userId: string, onOffline: () => void): void {
    this.offlineTimers.delete(userId);
    this.socketsByUser.delete(userId);
    onOffline();
  }

  private cancelOfflineTimer(userId: string): void {
    clearTimeout(this.offlineTimers.get(userId));
    this.offlineTimers.delete(userId);
  }
}
