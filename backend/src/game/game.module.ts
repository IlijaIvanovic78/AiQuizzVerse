import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
