import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake (query or auth header)
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        client.handshake.query?.token;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token as string, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const userId = payload.sub || payload.userId;

      // Store userId in socket data for later use
      client.data.userId = userId;

      // Map userId to socketId
      this.userSockets.set(userId, client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Get user's friends
      const friends = await this.getFriendIds(userId);

      // Notify all online friends that this user is now online
      friends.forEach((friendId) => {
        const friendSocketId = this.userSockets.get(friendId);
        if (friendSocketId) {
          this.server.to(friendSocketId).emit('friend-online', {
            userId,
            timestamp: new Date().toISOString(),
          });
        }
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      // Remove from map
      this.userSockets.delete(userId);

      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);

      // Get user's friends
      const friends = await this.getFriendIds(userId);

      // Notify all online friends that this user is now offline
      friends.forEach((friendId) => {
        const friendSocketId = this.userSockets.get(friendId);
        if (friendSocketId) {
          this.server.to(friendSocketId).emit('friend-offline', {
            userId,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  // Helper method to get all friend IDs for a user
  private async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        AND: [
          {
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
          {
            status: 'ACCEPTED',
          },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    // Extract friend IDs (the other party in each friendship)
    return friendships.map((friendship) =>
      friendship.senderId === userId ? friendship.receiverId : friendship.senderId,
    );
  }

  // Method to emit friend request sent notification
  emitFriendRequestSent(receiverId: string, senderData: any) {
    const receiverSocketId = this.userSockets.get(receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('friend-request-sent', {
        from: senderData,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`Friend request notification sent to user: ${receiverId}`);
    }
  }

  // Method to emit friend request accepted notification
  emitFriendRequestAccepted(senderId: string, accepterData: any) {
    const senderSocketId = this.userSockets.get(senderId);
    if (senderSocketId) {
      this.server.to(senderSocketId).emit('friend-request-accepted', {
        from: accepterData,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`Friend request accepted notification sent to user: ${senderId}`);
    }
  }

  // Method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Method to get all online user IDs
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
