import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameRoomService {
  private readonly logger = new Logger('GameRoomService');

  /** socketId → userId */
  private socketUsers = new Map<string, string>();
  /** matchId → set of socketIds */
  private matchRooms = new Map<string, Set<string>>();

  registerSocket(socketId: string, userId: string): void {
    this.socketUsers.set(socketId, userId);
  }

  unregisterSocket(socketId: string): string | undefined {
    const userId = this.socketUsers.get(socketId);
    this.socketUsers.delete(socketId);
    return userId;
  }

  getUserId(socketId: string): string | undefined {
    return this.socketUsers.get(socketId);
  }

  joinRoom(matchId: string, socketId: string): void {
    if (!this.matchRooms.has(matchId)) {
      this.matchRooms.set(matchId, new Set());
    }
    this.matchRooms.get(matchId)!.add(socketId);
  }

  leaveRoom(matchId: string, socketId: string): void {
    this.matchRooms.get(matchId)?.delete(socketId);
  }

  /** Handle disconnect: remove from all rooms, return matchIds the socket was in */
  handleDisconnect(socketId: string, server: Server): string | undefined {
    const userId = this.unregisterSocket(socketId);
    if (!userId) return undefined;

    for (const [matchId, sockets] of this.matchRooms.entries()) {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        server.to(`match:${matchId}`).emit('player-disconnected', { userId });
      }
    }
    return userId;
  }

  cleanupMatch(matchId: string): void {
    this.matchRooms.delete(matchId);
  }
}
