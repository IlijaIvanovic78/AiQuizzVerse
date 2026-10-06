import { Module } from '@nestjs/common';
import { ChestsModule } from '../chests/chests.module';
import { FriendsModule } from '../friends/friends.module';
import { LearningPathsModule } from '../learning-paths/learning-paths.module';
import { ProgressionModule } from '../progression/progression.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ReviewModule } from '../review/review.module';
import { MatchGateway } from './match.gateway';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import { MatchSessionRegistry } from './match-session-registry.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [
    RealtimeModule,
    FriendsModule,
    LearningPathsModule,
    ReviewModule,
    ProgressionModule,
    ChestsModule,
  ],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchPlayService,
    MatchResultsService,
    MatchSessionRegistry,
    MatchGateway,
  ],
})
export class MatchesModule {}
