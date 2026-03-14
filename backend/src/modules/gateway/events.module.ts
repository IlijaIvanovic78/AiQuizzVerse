import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({}), // JWT configured dynamically with env variables
    PrismaModule,
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
