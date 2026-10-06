import { Injectable } from '@nestjs/common';
import { userRoom } from './realtime.constants';
import { RealtimeGateway } from './realtime.gateway';
import { ServerToClientEvents } from './realtime.types';

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: RealtimeGateway) {}

  /** The payload type follows the event name, so a wrong payload for an event does not compile. */
  emitToUser<E extends keyof ServerToClientEvents>(
    userId: string,
    event: E,
    ...payload: Parameters<ServerToClientEvents[E]>
  ): void {
    this.gateway.server.to(userRoom(userId)).emit(event, ...payload);
  }
}
