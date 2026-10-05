import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { LeaderboardService } from './leaderboard.service';
import { Leaderboard } from './leaderboard.types';

@ApiTags('Leaderboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  getLeaderboard(
    @CurrentUserId() userId: string,
    @Query() query: LeaderboardQueryDto,
  ): Promise<Leaderboard> {
    return this.leaderboard.getLeaderboard(userId, query.scope);
  }
}
