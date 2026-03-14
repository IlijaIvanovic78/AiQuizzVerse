import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { EventsModule } from '../gateway/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [FriendshipController],
  providers: [FriendshipService],
  exports: [FriendshipService],
})
export class FriendshipModule {}
