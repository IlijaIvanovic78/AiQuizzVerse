import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FriendsModule } from './modules/friends/friends.module';
import { HealthModule } from './modules/health/health.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { LearningPathsModule } from './modules/learning-paths/learning-paths.module';
import { MatchesModule } from './modules/matches/matches.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ProgressionModule } from './modules/progression/progression.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ReviewModule } from './modules/review/review.module';
import { ShopModule } from './modules/shop/shop.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProgressionModule,
    RealtimeModule,
    FriendsModule,
    ProfileModule,
    DocumentsModule,
    AiModule,
    QuizzesModule,
    LearningPathsModule,
    ReviewModule,
    MatchesModule,
    ShopModule,
    PaymentsModule,
    LeaderboardModule,
    HealthModule,
  ],
})
export class AppModule {}
