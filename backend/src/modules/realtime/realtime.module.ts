import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PresenceService } from './presence.service';
import { RealtimeGateway } from './realtime.gateway';
import { WsAuthService } from './ws-auth.service';

@Module({
  providers: [RealtimeGateway, PresenceService, NotificationsService, WsAuthService],
  exports: [PresenceService, NotificationsService, WsAuthService],
})
export class RealtimeModule {}
