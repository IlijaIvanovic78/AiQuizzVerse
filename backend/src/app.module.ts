import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { FriendshipModule } from './friendship/friendship.module';
import { EventsModule } from './gateway/events.module';
import { AiModule } from './ai/ai.module';
import { UploadModule } from './upload/upload.module';
import { QuizModule } from './quiz/quiz.module';
import { GameModule } from './game/game.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
