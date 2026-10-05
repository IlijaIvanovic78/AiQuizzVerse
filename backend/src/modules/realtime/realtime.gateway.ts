import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { errorStack } from '../../common/utils/errors';
import { PrismaService } from '../../prisma/prisma.service';
import { acceptedFriendshipsOf, otherUserId } from '../friends/friend.mapper';
import { PresenceService } from './presence.service';
import { DEFAULT_FRONTEND_URL, userRoom } from './realtime.constants';
import type { RealtimeServer, RealtimeSocket } from './realtime.types';
import { WsAuthService } from './ws-auth.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: RealtimeServer;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly presence: PresenceService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: RealtimeServer): void {
    server.use(this.wsAuth.middleware);
  }

  async handleConnection(socket: RealtimeSocket): Promise<void> {
    const { userId } = socket.data;
    await socket.join(userRoom(userId));
    if (this.presence.connect(userId, socket.id)) {
      await this.notifyFriends(userId, 'friend:online');
    }
  }

  handleDisconnect(socket: RealtimeSocket): void {
    const { userId } = socket.data;
    this.presence.disconnect(userId, socket.id, () => {
      void this.notifyFriends(userId, 'friend:offline');
    });
  }

  private async notifyFriends(
    userId: string,
    event: 'friend:online' | 'friend:offline',
  ): Promise<void> {
    try {
      const friendIds = await this.findFriendIds(userId);
      // An empty room list would broadcast to every connected socket.
      if (friendIds.length === 0) {
        return;
      }
      this.server.to(friendIds.map(userRoom)).emit(event, { userId });
    } catch (error) {
      this.logger.error(`Could not notify the friends of ${userId}`, errorStack(error));
    }
  }

  // FriendsModule imports RealtimeModule, so the gateway cannot use FriendsService for this.
  private async findFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: acceptedFriendshipsOf(userId),
      select: { senderId: true, receiverId: true },
    });
    return friendships.map((friendship) => otherUserId(friendship, userId));
  }
}
