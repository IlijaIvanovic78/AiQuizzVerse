import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { FriendshipModule } from './modules/friendship/friendship.module';
import { EventsModule } from './modules/gateway/events.module';
import { AiModule } from './modules/ai/ai.module';
import { UploadModule } from './modules/upload/upload.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { GameModule } from './modules/game/game.module';
import { ShopModule } from './modules/shop/shop.module';
import { AvatarModule } from './modules/avatar/avatar.module';
import { RankedModule } from './modules/ranked/ranked.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    FriendshipModule,
    EventsModule,
    HealthModule,
    AiModule,
    UploadModule,
    QuizModule,
    GameModule,
    ShopModule,
    AvatarModule,
    RankedModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
