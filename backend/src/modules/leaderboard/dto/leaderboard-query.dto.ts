import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { LEADERBOARD_SCOPES } from '../leaderboard.constants';
import type { LeaderboardScope } from '../leaderboard.types';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: LEADERBOARD_SCOPES, default: 'friends' })
  @IsOptional()
  @IsIn(LEADERBOARD_SCOPES, { message: 'Pick friends or global.' })
  scope: LeaderboardScope = 'friends';
}
