import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global leaderboard (top users by XP)' })
  async getGlobalLeaderboard() {
    return this.leaderboardService.getGlobalLeaderboard();
  }

  @Get('friends')
  @ApiOperation({ summary: 'Get friends leaderboard (accepted friends + self)' })
  async getFriendsLeaderboard(@CurrentUser('userId') userId: string) {
    return this.leaderboardService.getFriendsLeaderboard(userId);
  }
}
